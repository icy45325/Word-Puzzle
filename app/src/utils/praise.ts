// 5-tier praise picker for level completion. Splits players by their
// efficiency: how fast they finished and how many hints they used. The
// caller passes the perf metrics; we map to a tier and pick a random
// message from the tier so repeat completions don't always say the
// same thing.
//
// Tiers:
//   5 = transcendent  — sub-30s + zero hints + zero misses
//   4 = excellent     — sub-60s OR zero hints
//   3 = solid         — under 2 minutes
//   2 = okay          — under 4 minutes
//   1 = took a while  — anything slower / lots of hints

export type PraiseTier = 1 | 2 | 3 | 4 | 5;

export interface PraiseInput {
  timeMs: number;
  hintsUsed: number;
  /** Total times the player submitted a wrong word in this level. */
  wrongAttempts?: number;
}

export function pickTier({
  timeMs,
  hintsUsed,
  wrongAttempts = 0,
}: PraiseInput): PraiseTier {
  const seconds = timeMs / 1000;
  if (seconds < 30 && hintsUsed === 0 && wrongAttempts === 0) return 5;
  if (seconds < 60 && hintsUsed === 0) return 4;
  if (seconds < 120) return 3;
  if (seconds < 240) return 2;
  return 1;
}

const POOL: Record<
  PraiseTier,
  { titleKey: string; subtitleKey: string }[]
> = {
  5: [
    { titleKey: 'praise.t5.transcendent', subtitleKey: 'praise.t5.subTranscendent' },
    { titleKey: 'praise.t5.flawless', subtitleKey: 'praise.t5.subFlawless' },
    { titleKey: 'praise.t5.legend', subtitleKey: 'praise.t5.subLegend' },
  ],
  4: [
    { titleKey: 'praise.t4.brilliant', subtitleKey: 'praise.t4.subBrilliant' },
    { titleKey: 'praise.t4.sharp', subtitleKey: 'praise.t4.subSharp' },
    { titleKey: 'praise.t4.outstanding', subtitleKey: 'praise.t4.subOutstanding' },
  ],
  3: [
    { titleKey: 'praise.t3.nice', subtitleKey: 'praise.t3.subNice' },
    { titleKey: 'praise.t3.solid', subtitleKey: 'praise.t3.subSolid' },
    { titleKey: 'praise.t3.smooth', subtitleKey: 'praise.t3.subSmooth' },
  ],
  2: [
    { titleKey: 'praise.t2.cleared', subtitleKey: 'praise.t2.subCleared' },
    { titleKey: 'praise.t2.gotIt', subtitleKey: 'praise.t2.subGotIt' },
    { titleKey: 'praise.t2.steady', subtitleKey: 'praise.t2.subSteady' },
  ],
  1: [
    { titleKey: 'praise.t1.tough', subtitleKey: 'praise.t1.subTough' },
    { titleKey: 'praise.t1.persistent', subtitleKey: 'praise.t1.subPersistent' },
    { titleKey: 'praise.t1.gritty', subtitleKey: 'praise.t1.subGritty' },
  ],
};

export interface PraiseKeys {
  tier: PraiseTier;
  titleKey: string;
  subtitleKey: string;
}

export function pickPraise(input: PraiseInput): PraiseKeys {
  const tier = pickTier(input);
  const pool = POOL[tier];
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { tier, titleKey: choice.titleKey, subtitleKey: choice.subtitleKey };
}
