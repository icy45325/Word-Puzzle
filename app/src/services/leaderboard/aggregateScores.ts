import type { LeaderboardEntry, Uuid } from '../types';

interface BotSeed {
  userId: string;
  displayName: string;
  furthestLevel: number;
  /** Aggregated coin balance — the metric we rank by. Users see their
   *  coin count in the TopBar, so the leaderboard reads at-a-glance. */
  coins: number;
}

interface BuildArgs {
  /** Current user identity. May be null on first-ever launch. */
  currentUserId?: Uuid | null;
  currentDisplayName?: string;
  /** Current user's coin balance, pulled from EconomyService. */
  currentCoins?: number;
  /** Current user's furthest unlocked level (1-based). */
  currentFurthestLevel?: number;
  /** Bot seed entries. */
  bots: BotSeed[];
}

/** Build the global leaderboard: bots + self always inserted, sorted by
 *  coins desc, ranked, top N. The self row is always shown so the
 *  player can see "where they stand"; the visible ranking is local-
 *  only until a real backend ships. */
export function buildGlobal(
  args: BuildArgs,
  topN: number
): LeaderboardEntry[] {
  const rows: Omit<LeaderboardEntry, 'rank'>[] = args.bots.map((b) => ({
    userId: b.userId,
    displayName: b.displayName,
    coins: b.coins,
    furthestLevel: b.furthestLevel,
    isBot: true,
  }));
  if (args.currentUserId) {
    rows.push({
      userId: args.currentUserId,
      displayName: args.currentDisplayName ?? '你',
      coins: args.currentCoins ?? 0,
      furthestLevel: args.currentFurthestLevel ?? 0,
      isSelf: true,
    });
  }
  rows.sort((a, b) => b.coins - a.coins);
  // Take top N. If the user's row would have been outside top N, swap in
  // their row at the bottom so they can always see where they roughly
  // stand. (The sticky-row UI still pins them to viewport edges when
  // scrolled.)
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
