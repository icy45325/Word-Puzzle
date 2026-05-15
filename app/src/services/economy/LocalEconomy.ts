import type {
  EconomyEvent,
  EconomyService,
  EconomyState,
  RemoteConfig,
  Uuid,
} from '../types';
import {
  CURRENT_SCHEMA_VERSION,
  keys,
  readJson,
  writeJson,
} from '../../store/storage';

const empty = (userId: Uuid): EconomyState => ({
  userId,
  coins: 0,
  hints: 0,
  points: 0,
  streakDays: 0,
  lastCheckInTs: null,
  schemaVersion: CURRENT_SCHEMA_VERSION,
});

/**
 * Three-currency economy (v8):
 *   • coins   — earned everywhere; spent only to buy tips
 *   • hints   — in-game-only consumable that reveals letters
 *   • points  — skill-only ranking metric, no spend path
 *
 * Persisted under `ws:{userId}:economy`. v3 → v4 migration: any pre-v8
 * row that's missing `points` gets `points: 0` on first read (handled
 * automatically by the `{...empty(), ...persisted}` spread in
 * getState).
 */
export class LocalEconomy implements EconomyService {
  private cache = new Map<Uuid, EconomyState>();
  private listeners = new Map<Uuid, Set<(s: EconomyState) => void>>();

  constructor(private readonly rc: RemoteConfig) {}

  async getState(userId: Uuid): Promise<EconomyState> {
    const c = this.cache.get(userId);
    if (c) return c;
    const persisted = await readJson<EconomyState>(keys.economy(userId));
    if (persisted) {
      // v3 saves are missing `points` — spread with the fresh empty()
      // template first so missing fields fill in to 0.
      const state = { ...empty(userId), ...persisted, userId };
      this.cache.set(userId, state);
      return state;
    }
    const fresh = empty(userId);
    fresh.hints = this.rc.getNumber('hint.startingCount', 0);
    this.cache.set(userId, fresh);
    if (fresh.hints > 0) await this.persist(fresh);
    return fresh;
  }

  async grant(userId: Uuid, event: EconomyEvent): Promise<EconomyState> {
    const state = { ...(await this.getState(userId)) };
    switch (event.type) {
      case 'word_found': {
        const base = this.rc.getNumber('reward.wordBase', 5);
        const perLetter = this.rc.getNumber('reward.wordPerLetter', 2);
        const wordPoints = this.rc.getNumber('reward.wordPoints', 1);
        state.coins += base + perLetter * event.length;
        state.points += wordPoints;
        break;
      }
      case 'level_complete': {
        const base = this.rc.getNumber('reward.levelComplete', 25);
        const perfectBonus = event.perfect
          ? this.rc.getNumber('reward.levelPerfectBonus', 25)
          : 0;
        const levelPoints = this.rc.getNumber('reward.levelPoints', 20);
        const perfectPoints = event.perfect
          ? this.rc.getNumber('reward.levelPerfectPoints', 10)
          : 0;
        state.coins += base + perfectBonus;
        state.points += levelPoints + perfectPoints;
        break;
      }
      case 'review_correct': {
        // ReviewQuiz used to call grantChapterReward directly with the
        // total coin reward. The new event-style path lets us also bump
        // points by count * reviewPoints. Callers should pass the
        // number of correct answers (not the coin amount).
        const coinPer = this.rc.getNumber('review.coinPerCorrect', 5);
        const pointsPer = this.rc.getNumber('reward.reviewPoints', 10);
        state.coins += coinPer * event.count;
        state.points += pointsPer * event.count;
        break;
      }
      case 'daily_checkin': {
        // Coins only — daily check-in is a passive reward, not skill.
        state.coins += this.rc.getNumber('reward.dailyCheckIn', 20);
        state.lastCheckInTs = Date.now();
        break;
      }
      case 'streak_increment': {
        // Coins only.
        state.streakDays = event.days;
        state.coins += this.rc.getNumber('reward.streakPerDay', 5) * event.days;
        break;
      }
      case 'ad_rewarded': {
        // Coins only — ad watching ≠ skill.
        state.coins += this.rc.getNumber('reward.adRewarded', 30);
        break;
      }
      case 'tips_grant': {
        // Paid SKU: hand out tips directly. coins & points untouched.
        state.hints += event.tips;
        break;
      }
    }
    await this.persist(state);
    return state;
  }

  async spend(
    userId: Uuid,
    kind: 'hint' | 'reveal_letter' | 'skip_level' | 'coins_to_hint',
    cost: number
  ): Promise<{ ok: boolean; state: EconomyState }> {
    const state = { ...(await this.getState(userId)) };
    if (kind === 'hint') {
      if (state.hints < cost) return { ok: false, state };
      state.hints -= cost;
    } else if (kind === 'coins_to_hint') {
      // Spend coins to gain 1 hint per `cost` coins. Single-shot exchange.
      if (state.coins < cost) return { ok: false, state };
      state.coins -= cost;
      state.hints += 1;
    } else {
      if (state.coins < cost) return { ok: false, state };
      state.coins -= cost;
    }
    await this.persist(state);
    return { ok: true, state };
  }

  async grantChapterReward(
    userId: Uuid,
    args: { chapter: number; coins: number; hints: number; points?: number }
  ): Promise<EconomyState> {
    const state = { ...(await this.getState(userId)) };
    state.coins += args.coins;
    state.hints += args.hints;
    if (args.points) state.points += args.points;
    await this.persist(state);
    return state;
  }

  subscribe(userId: Uuid, listener: (s: EconomyState) => void): () => void {
    let set = this.listeners.get(userId);
    if (!set) {
      set = new Set();
      this.listeners.set(userId, set);
    }
    set.add(listener);
    return () => set?.delete(listener);
  }

  private async persist(state: EconomyState): Promise<void> {
    this.cache.set(state.userId, state);
    await writeJson(keys.economy(state.userId), {
      ...state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
    this.listeners.get(state.userId)?.forEach((fn) => fn(state));
  }
}
