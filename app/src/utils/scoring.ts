// Centralized scoring so leaderboards, daily-challenge rankings, and
// personal bests all agree. Never inline these formulas in components.
export interface ScoreInput {
  wordsFound: number;
  totalWords: number;
  timeMs: number;
  hintsUsed: number;
}

export function computeScore(input: ScoreInput): number {
  const completion = input.totalWords === 0 ? 0 : input.wordsFound / input.totalWords;
  const base = 100 * completion;
  const wordBonus = 15 * input.wordsFound;
  const timeSeconds = input.timeMs / 1000;
  const timeBonus = Math.max(0, 60 - timeSeconds) * 2;
  const hintPenalty = 25 * input.hintsUsed;
  return Math.max(0, Math.round(base + wordBonus + timeBonus - hintPenalty));
}

export function isPerfect(input: ScoreInput): boolean {
  return (
    input.totalWords > 0 &&
    input.wordsFound === input.totalWords &&
    input.hintsUsed === 0
  );
}
