// CEFR (Common European Framework of Reference) helpers. The app uses
// CEFR (A1-C1) as the source-of-truth difficulty tag for words and
// levels, and overlays Chinese-context milestone labels (小学 / 中考 /
// 高考 / 四级·雅思 / 六级·托福) for the familiar local reading.
//
// Single source of truth — every consumer (generator, MapScreen,
// GameScreen header, VocabularyScreen) should pull labels and colors
// from here so re-labeling is a one-line change.

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

/** Numeric ordering for "≤" comparisons. A1 = 1 … C1 = 5. */
export function cefrRank(cefr: CefrLevel | null | undefined): number {
  switch (cefr) {
    case 'A1': return 1;
    case 'A2': return 2;
    case 'B1': return 3;
    case 'B2': return 4;
    case 'C1': return 5;
    default: return 0;
  }
}

/** Chinese-context milestone label per CEFR level. Returned as a
 *  human-readable composite (e.g. "四级 · 雅思"). UI keeps it as-is. */
export function milestoneOf(cefr: CefrLevel): string {
  switch (cefr) {
    case 'A1': return '小学';
    case 'A2': return '中考';
    case 'B1': return '高考';
    case 'B2': return '四级 · 雅思';
    case 'C1': return '六级 · 托福';
  }
}

/** Color for the CEFR badge / star fill. Theme-independent so the tier
 *  is visually consistent across all 4 app themes. */
export function cefrColor(cefr: CefrLevel): string {
  switch (cefr) {
    case 'A1': return '#22C55E'; // green-500
    case 'A2': return '#3B82F6'; // blue-500
    case 'B1': return '#8B5CF6'; // violet-500
    case 'B2': return '#F97316'; // orange-500
    case 'C1': return '#EF4444'; // red-500
  }
}

/** A compact "CEFR · milestone" composite for chapter banners.
 *  e.g. "CEFR A1 · 小学" / "CEFR B2 · 四级 · 雅思". */
export function cefrFullLabel(cefr: CefrLevel): string {
  return `CEFR ${cefr} · ${milestoneOf(cefr)}`;
}
