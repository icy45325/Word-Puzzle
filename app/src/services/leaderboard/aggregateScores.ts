import type { LeaderboardEntry, ScoreRecord, Uuid } from '../types';
import { levelNumberOf } from '../../utils/levelNumber';

interface BotSeed {
  userId: string;
  displayName: string;
  furthestLevel: number;
  totalScore: number;
}

interface BuildArgs {
  /** Per-level PB records for the current user. May be empty. */
  selfScores: ScoreRecord[];
  /** Current user identity — drives isSelf flag + displayName lookup. */
  currentUserId?: Uuid | null;
  currentDisplayName?: string;
  /** Bot seed entries (already aggregated). */
  bots: BotSeed[];
}

/** Aggregate a single user's PB records into a single LeaderboardEntry-
 *  shaped row (rank is filled in later by buildGlobal). */
export function aggregateUser(
  userId: Uuid,
  displayName: string,
  records: ScoreRecord[]
): Omit<LeaderboardEntry, 'rank'> {
  let totalScore = 0;
  let furthestLevel = 0;
  for (const r of records) {
    totalScore += r.score;
    const n = levelNumberOf(r.levelId);
    if (n > furthestLevel) furthestLevel = n;
  }
  return {
    userId,
    displayName,
    totalScore,
    furthestLevel,
  };
}

/** Build the global leaderboard: bots + self, sorted by totalScore desc,
 *  ranked, top N. */
export function buildGlobal(
  args: BuildArgs,
  topN: number
): LeaderboardEntry[] {
  const rows: Omit<LeaderboardEntry, 'rank'>[] = args.bots.map((b) => ({
    userId: b.userId,
    displayName: b.displayName,
    totalScore: b.totalScore,
    furthestLevel: b.furthestLevel,
    isBot: true,
  }));
  if (args.currentUserId && args.selfScores.length > 0) {
    const selfRow = aggregateUser(
      args.currentUserId,
      args.currentDisplayName ?? '你',
      args.selfScores
    );
    rows.push({ ...selfRow, isSelf: true });
  }
  rows.sort((a, b) => b.totalScore - a.totalScore);
  return rows.slice(0, topN).map((r, i) => ({ ...r, rank: i + 1 }));
}
