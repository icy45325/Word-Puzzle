// Calendar-day math + reward curve for the daily check-in / streak system.
// Pure functions only — no AsyncStorage, no React, easy to unit test.
//
// "Streak" rules:
//   - lastCheckInTs null  → first ever check-in, nextStreak = 1
//   - same calendar day   → already claimed today, no change
//   - exactly +1 day      → continuation, nextStreak = currentStreak + 1
//   - +2 days or more     → streak broken, nextStreak = 1
//
// Local-time semantics: we compare calendar days in the device's timezone.
// Travelers crossing the dateline can game it; documented as a known limit.

export interface CheckInStatus {
  /** True when the player already claimed today and shouldn't claim again. */
  alreadyClaimed: boolean;
  /** What `streakDays` will become after a successful claim right now. */
  nextStreak: number;
  /** True when the next streak number lands on a 7-day milestone. */
  isMilestone: boolean;
  /** True when streak resets to 1 because the player skipped at least a day. */
  brokeStreak: boolean;
}

export interface DailyCheckInReward {
  coins: number;
  /** Bonus hints awarded only on weekly milestones (multiples of cycleSize). */
  hints: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Number of full local-calendar days separating two timestamps (b - a). */
export function daysBetween(a: number, b: number): number {
  const da = startOfLocalDay(a);
  const db = startOfLocalDay(b);
  return Math.round((db - da) / MS_PER_DAY);
}

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function checkInStatus(
  lastCheckInTs: number | null,
  currentStreak: number,
  now: number,
  cycleSize: number = 7
): CheckInStatus {
  if (!lastCheckInTs) {
    return {
      alreadyClaimed: false,
      nextStreak: 1,
      isMilestone: 1 % cycleSize === 0,
      brokeStreak: false,
    };
  }
  const gap = daysBetween(lastCheckInTs, now);
  if (gap <= 0) {
    return {
      alreadyClaimed: true,
      nextStreak: currentStreak,
      isMilestone: currentStreak > 0 && currentStreak % cycleSize === 0,
      brokeStreak: false,
    };
  }
  if (gap === 1) {
    const next = currentStreak + 1;
    return {
      alreadyClaimed: false,
      nextStreak: next,
      isMilestone: next % cycleSize === 0,
      brokeStreak: false,
    };
  }
  return {
    alreadyClaimed: false,
    nextStreak: 1,
    isMilestone: 1 % cycleSize === 0,
    brokeStreak: true,
  };
}

export function computeReward(
  streak: number,
  cfg: {
    baseCoins: number;
    perStreakCoins: number;
    weeklyHints: number;
    cycleSize: number;
  }
): DailyCheckInReward {
  return {
    coins: cfg.baseCoins + cfg.perStreakCoins * streak,
    hints: streak > 0 && streak % cfg.cycleSize === 0 ? cfg.weeklyHints : 0,
  };
}
