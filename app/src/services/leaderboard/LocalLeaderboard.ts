import type {
  EconomyService,
  Friend,
  LeaderboardEntry,
  LeaderboardScope,
  LeaderboardService,
  ProgressRepo,
  ScoreRecord,
  Uuid,
} from '../types';
import { keys, readJson, writeJson } from '../../store/storage';
import { buildGlobal } from './aggregateScores';
import botsData from './bots.json';

const BOTS = (botsData as {
  bots: {
    userId: string;
    displayName: string;
    furthestLevel: number;
    coins: number;
  }[];
}).bots;

/**
 * Local leaderboard with seeded bot global ranking.
 *
 * Submission model: per-level **personal best** for self-tab history.
 * Global ranking metric is **coins** (pulled live from EconomyService)
 * since users see their coin balance in TopBar — keeps the leaderboard
 * reading at-a-glance.
 *
 * Self row is always inserted into the global rankings (the earlier
 * "must clear 80% to qualify" gate was hidden per UX feedback so the
 * player always sees roughly where they stand).
 *
 * Friends / friend-system stays a coming-soon stub until a real
 * backend exists.
 */
export class LocalLeaderboard implements LeaderboardService {
  /** Current user — set externally so getTop('global') can flag isSelf
   *  without forcing every caller to pass userId. */
  private currentUserId: Uuid | null = null;
  private currentDisplayName: string | null = null;
  /** Optional injections — provider wires these in after construction so
   *  the global tab can read live coins + furthest level without a
   *  round-trip through every caller. */
  private economy: EconomyService | null = null;
  private progress: ProgressRepo | null = null;

  setUser(userId: Uuid | null, displayName?: string): void {
    this.currentUserId = userId;
    this.currentDisplayName = displayName ?? null;
  }

  setEconomy(economy: EconomyService): void {
    this.economy = economy;
  }

  setProgress(progress: ProgressRepo): void {
    this.progress = progress;
  }

  private async loadOwnScores(userId: Uuid): Promise<ScoreRecord[]> {
    const raw = (await readJson<ScoreRecord[]>(keys.scores(userId))) ?? [];
    // Lazy migration: legacy storage may have multiple rows per levelId
    // (old ring buffer of all submissions). Collapse to one PB per level.
    const byLevel = new Map<string, ScoreRecord>();
    for (const r of raw) {
      const prev = byLevel.get(r.levelId);
      if (!prev || prev.score < r.score) byLevel.set(r.levelId, r);
    }
    if (byLevel.size !== raw.length) {
      const collapsed = [...byLevel.values()];
      await writeJson(keys.scores(userId), collapsed);
      return collapsed;
    }
    return raw;
  }

  async submit(record: ScoreRecord): Promise<void> {
    const key = keys.scores(record.userId);
    const all = await this.loadOwnScores(record.userId);
    const existing = all.find((r) => r.levelId === record.levelId);
    if (!existing || existing.score < record.score) {
      const next = all.filter((r) => r.levelId !== record.levelId);
      next.push(record);
      await writeJson(key, next);
    }
  }

  async getTop(
    scope: LeaderboardScope,
    n: number,
    currentUserId?: Uuid
  ): Promise<LeaderboardEntry[]> {
    if (scope === 'friends') return [];
    const uid = currentUserId ?? this.currentUserId ?? null;

    // Resolve live coin balance + furthest level for the self row.
    let selfCoins = 0;
    let selfFurthest = 0;
    if (uid) {
      try {
        if (this.economy) {
          const eco = await this.economy.getState(uid);
          selfCoins = eco.coins;
        }
        if (this.progress) {
          const prog = await this.progress.load(uid);
          // furthestLevelIndex is 0-based; +1 for 1-based level number
          selfFurthest = prog.furthestLevelIndex + 1;
        }
      } catch {
        /* if either read fails, fall through with 0s */
      }
    }

    if (scope === 'self') {
      // self tab returns the aggregate single-row form for the summary
      // card; the screen reads per-level PBs separately via listPB.
      if (!uid) return [];
      return [
        {
          userId: uid,
          displayName: this.currentDisplayName ?? '你',
          rank: 1,
          coins: selfCoins,
          furthestLevel: selfFurthest,
          isSelf: true,
        },
      ];
    }

    // global: bots + self always inserted (self row is local-only sim
    // until a real backend exists; the 80% gate from earlier is dropped
    // per UX feedback — players want to see their estimated position
    // immediately, not a "你还不够格" prompt).
    return buildGlobal(
      {
        bots: BOTS,
        currentUserId: uid ?? undefined,
        currentDisplayName: this.currentDisplayName ?? '你',
        currentCoins: selfCoins,
        currentFurthestLevel: selfFurthest,
      },
      n
    );
  }

  async getPersonalBest(
    userId: Uuid,
    levelId: string
  ): Promise<ScoreRecord | null> {
    const all = await this.loadOwnScores(userId);
    return all.find((r) => r.levelId === levelId) ?? null;
  }

  async listPersonalBests(userId: Uuid): Promise<ScoreRecord[]> {
    const all = await this.loadOwnScores(userId);
    return [...all].sort((a, b) => (a.levelId < b.levelId ? -1 : 1));
  }

  myFriendCode(userId: Uuid): string {
    return userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  }

  async listFriends(userId: Uuid): Promise<Friend[]> {
    return (await readJson<Friend[]>(keys.friends(userId))) ?? [];
  }

  async addFriend(
    _userId: Uuid,
    _code: string
  ): Promise<{ ok: boolean; reason?: string }> {
    return { ok: false, reason: 'feature_pending_backend' };
  }

  async removeFriend(userId: Uuid, friendUserId: Uuid): Promise<void> {
    const list = await this.listFriends(userId);
    const next = list.filter((f) => f.userId !== friendUserId);
    await writeJson(keys.friends(userId), next);
  }
}
