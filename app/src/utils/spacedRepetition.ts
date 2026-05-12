// Leitner-style spaced repetition. Six mastery boxes (0-5).
// Box 0: just learned, due immediately for the next review session.
// Box 5: mastered, nudged back ~1 month away.
//
// `applyResult(correct)` either bumps mastery up (correct) or knocks it
// back one box (incorrect). `nextDueAt(level, from)` is pure so you can
// precompute or test.

const DAY_MS = 24 * 60 * 60 * 1000;

export const MAX_MASTERY = 5;

export const REVIEW_INTERVALS_MS: readonly number[] = [
  0, // 0: review immediately (just learned, included in next session)
  1 * DAY_MS, // 1
  3 * DAY_MS, // 2
  7 * DAY_MS, // 3
  14 * DAY_MS, // 4
  30 * DAY_MS, // 5
];

export function clampMastery(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.max(0, Math.min(MAX_MASTERY, Math.floor(level)));
}

export function nextDueAt(masteryLevel: number, from: number = Date.now()): number {
  const idx = clampMastery(masteryLevel);
  return from + REVIEW_INTERVALS_MS[idx];
}

export interface ReviewResultInput {
  masteryLevel?: number;
  reviewCount?: number;
  correctStreak?: number;
}

export interface ReviewResultPatch {
  masteryLevel: number;
  lastReviewedAt: number;
  nextReviewDue: number;
  reviewCount: number;
  correctStreak: number;
}

export function applyReview(
  current: ReviewResultInput,
  correct: boolean,
  now: number = Date.now()
): ReviewResultPatch {
  const prev = clampMastery(current.masteryLevel ?? 0);
  const next = correct ? Math.min(MAX_MASTERY, prev + 1) : Math.max(0, prev - 1);
  return {
    masteryLevel: next,
    lastReviewedAt: now,
    nextReviewDue: nextDueAt(next, now),
    reviewCount: (current.reviewCount ?? 0) + 1,
    correctStreak: correct ? (current.correctStreak ?? 0) + 1 : 0,
  };
}

/**
 * Manual mastery nudge from "I remember it / not yet" buttons in
 * WordDetailModal. Doesn't bump reviewCount (that's reserved for actual
 * quiz attempts).
 */
export function applyMasteryDelta(
  current: ReviewResultInput,
  delta: 1 | -1,
  now: number = Date.now()
): ReviewResultPatch {
  const prev = clampMastery(current.masteryLevel ?? 0);
  const next = clampMastery(prev + delta);
  return {
    masteryLevel: next,
    lastReviewedAt: now,
    nextReviewDue: nextDueAt(next, now),
    reviewCount: current.reviewCount ?? 0,
    correctStreak: delta === 1 ? (current.correctStreak ?? 0) : 0,
  };
}
