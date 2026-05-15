import type { LeaderboardEntry, Uuid } from '../types';

interface BotSeed {
  userId: string;
  displayName: string;
  furthestLevel: number;
  /** Points balance — the ranking metric (v8). Earned only from skill
   *  events (word_found / level_complete / review_correct). */
  points: number;
}

interface BuildArgs {
  /** Current user identity. May be null on first-ever launch. */
  currentUserId?: Uuid | null;
  currentDisplayName?: string;
  /** Current user's points balance, pulled from EconomyService. */
  currentPoints?: number;
  /** Current user's furthest unlocked level (1-based). */
  currentFurthestLevel?: number;
  /** Bot seed entries. */
  bots: BotSeed[];
}

/** Build the global leaderboard: bots + self always inserted, sorted by
 *  points desc, ranked, top N. The self row is always shown so the
 *  player can see "where they stand"; the visible ranking is local-
 *  only until a real backend ships. */
export function buildGlobal(
  args: BuildArgs,
  topN: number
): LeaderboardEntry[] {
  const rows: Omit<LeaderboardEntry, 'rank'>[] = args.bots.map((b) => ({
    userId: b.userId,
    displayName: b.displayName,
    points: b.points,
    furthestLevel: b.furthestLevel,
    isBot: true,
  }));
  if (args.currentUserId) {
    rows.push({
      userId: args.currentUserId,
      displayName: args.currentDisplayName ?? '你',
      points: args.currentPoints ?? 0,
      furthestLevel: args.currentFurthestLevel ?? 0,
      isSelf: true,
    });
  }
  rows.sort((a, b) => b.points - a.points);
  // Take top N. If the user's row would have been outside top N, swap
  // them in at the bottom so they can always see where they stand.
  let sliced = rows.slice(0, topN).map((r, i) => ({ ...r, rank: i + 1 }));
  const selfInSlice = sliced.find((r) => r.isSelf);
  const selfAll = rows.find((r) => r.isSelf);
  if (!selfInSlice && selfAll) {
    const selfRank = rows.indexOf(selfAll) + 1;
    sliced = [
      ...sliced.slice(0, topN - 1),
      { ...selfAll, rank: selfRank },
    ];
  }
  return sliced;
}
