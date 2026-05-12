import type {
  Friend,
  LeaderboardEntry,
  LeaderboardScope,
  LeaderboardService,
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
    totalScore: number;
  }[];
}).bots;

/**
 * Local leaderboard with seeded bot global ranking.
 *
 * Submission model: per-level **personal best**. Re-playing a level only
 * keeps the higher score; the array stays at most LEVELS-long instead of
 * a 200-row ring buffer of every submission. Auto-migrates legacy ring-
 * buffer data on first read.
 *
 * Global tab: bots + self merged, sorted by aggregated total score.
 * Friends / friend-system stays a coming-soon stub (returns [] / fails
 * addFriend) until a real backend exists.
 */
export class LocalLeaderboard implements LeaderboardService {
  /** Current user — set externally so getTop('global') can flag isSelf
   *  without forcing every caller to pass userId. */
  private currentUserId: Uuid | null = null;
  private currentDisplayName: string | null = null;

  setUser(userId: Uuid | null, displayName?: string): void {
    this.currentUserId = userId;
    this.currentDisplayName = displayName ?? null;
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
    if (scope === 'friends') {
      // No backend yet — the FriendsScreen renders a "coming soon"
      // placeholder in this state.
      return [];
    }
    const uid = currentUserId ?? this.currentUserId ?? null;
    const selfScores = uid ? await this.loadOwnScores(uid) : [];
    if (scope === 'self') {
      // self tab uses listPersonalBests; getTop('self') returns the
      // aggregate single-row form so the screen can show a "你的总分"
      // header consistently.
      if (!uid || selfScores.length === 0) return [];
      const total = buildGlobal(
        {
          selfScores,
          currentUserId: uid,
          currentDisplayName: this.currentDisplayName ?? '你',
          bots: [],
        },
        1
      );
      return total;
    }
    // global
    return buildGlobal(
      {
        selfScores,
        currentUserId: uid ?? undefined,
        currentDisplayName: this.currentDisplayName ?? '你',
        bots: BOTS,
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
    // Sort by levelId for a stable, navigable list. levelNumberOf would
    // be nicer but a string sort of "L01" "L02" "L100" still works since
    // the storage layer's levelIds are zero-padded for L01-L99.
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
