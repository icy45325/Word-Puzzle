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
  streakDays: 0,
  lastCheckInTs: null,
  schemaVersion: CURRENT_SCHEMA_VERSION,
});

export class LocalEconomy implements EconomyService {
  private cache = new Map<Uuid, EconomyState>();
  private listeners = new Map<Uuid, Set<(s: EconomyState) => void>>();

  constructor(private readonly rc: RemoteConfig) {}

  async getState(userId: Uuid): Promise<EconomyState> {
    const c = this.cache.get(userId);
    if (c) return c;
    const persisted = await readJson<EconomyState>(keys.economy(userId));
    if (persisted) {
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
        state.coins += base + perLetter * event.length;
        break;
      }
      case 'level_complete': {
        const base = this.rc.getNumber('reward.levelComplete', 25);
        const perfectBonus = event.perfect
          ? this.rc.getNumber('reward.levelPerfectBonus', 25)
          : 0;
        state.coins += base + perfectBonus;
        break;
      }
      case 'daily_checkin': {
        state.coins += this.rc.getNumber('reward.dailyCheckIn', 20);
        state.lastCheckInTs = Date.now();
        break;
      }
      case 'streak_increment': {
        state.streakDays = event.days;
        state.coins += this.rc.getNumber('reward.streakPerDay', 5) * event.days;
        break;
      }
      case 'ad_rewarded': {
        state.coins += this.rc.getNumber('reward.adRewarded', 30);
        break;
      }
      case 'iap_grant': {
        state.coins += event.coins;
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
      // Spend coins to gain 1 hint per `cost` coins. Single-shot exchange:
      // cost is the price for one hint; we charge once and grant 1 hint.
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
    args: { chapter: number; coins: number; hints: number }
  ): Promise<EconomyState> {
    const state = { ...(await this.getState(userId)) };
    state.coins += args.coins;
    state.hints += args.hints;
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
