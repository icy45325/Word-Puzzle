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
  /** Current user's furthest unlocked level (1-based). Used by the
   *  eligibility gate so a brand-new player doesn't crash the bottom
   *  of the global board. */
  currentFurthestLevel?: number;
  /** True only when the user has cleared enough of the game to appear
   *  in the global rankings (see leaderboard.global.eligibleAtLevel). */
  selfEligibleForGlobal: boolean;
  /** Bot seed entries. */
  bots: BotSeed[];
}

/** Build the global leaderboard: bots + self (if eligible), sorted by
 *  coins desc, ranked, top N. */
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
  if (args.currentUserId && args.selfEligibleForGlobal) {
    rows.push({
      userId: args.currentUserId,
      displayName: args.currentDisplayName ?? '你',
      coins: args.currentCoins ?? 0,
      furthestLevel: args.currentFurthestLevel ?? 0,
      isSelf: true,
    });
  }
  rows.sort((a, b) => b.coins - a.coins);
  return rows.slice(0, topN).map((r, i) => ({ ...r, rank: i + 1 }));
}
