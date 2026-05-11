import dictionary from '../data/dictionary.json';
import { canFormFromLetters } from './wordValidation';

export type Direction = 'H' | 'V';

export interface Answer {
  word: string;
  row: number;
  col: number;
  dir: Direction;
}

export interface LevelDef {
  id: string;
  letters: string[];
  answers: Answer[];
}

export interface Cell {
  row: number;
  col: number;
  /** Preset letter from the level's canonical answer at this cell — used
   *  for hint reveals (which show the canonical letter) when no acceptable
   *  word has been spelled in for this slot yet. */
  letter: string;
  /** Indices into LevelLayout.slots — which slots pass through this cell.
   *  At render time the grid uses the *filled* slot to pick which letter to
   *  show; cells in unfilled slots stay blank. */
  slotIndexes: number[];
  /** Position within each slot (parallel to slotIndexes) so the cell can
   *  pull `word[posInSlot]` from the filling word. */
  posInSlot: number[];
}

export interface Slot {
  word: string; // canonical/preset word (used as a fallback / for the
                // generator). Player can fill the slot with any word in
                // acceptableWords.
  row: number;
  col: number;
  dir: Direction;
  length: number;
  /** First letter constraint — fixed by the intersection with the mother
   *  word at this slot's start cell. */
  firstLetter: string;
  /** Every dictionary word that satisfies this slot: matching length,
   *  matching firstLetter, formable from the level's letter pool. The
   *  canonical word is always in here. */
  acceptableWords: string[];
}

export interface LevelLayout {
  rows: number;
  cols: number;
  cells: Cell[];
  slots: Slot[];
  /** Convenience: list of preset (canonical) answer words. Some screens
   *  still use this for chapter-end "new words" aggregation; gameplay
   *  uses slots instead. */
  answerWords: string[];
}

const dict = dictionary as Record<string, unknown>;

function findAcceptable(
  length: number,
  firstLetter: string,
  letterPool: string[]
): string[] {
  const out: string[] = [];
  for (const w of Object.keys(dict)) {
    if (w.length !== length) continue;
    if (w[0] !== firstLetter) continue;
    if (!canFormFromLetters(w, letterPool)) continue;
    out.push(w);
  }
  return out;
}

export function layoutLevel(level: LevelDef): LevelLayout {
  // Build slots first; each slot needs its firstLetter (the letter sitting
  // at its origin cell, which is fixed by whichever answer covers it).
  const slots: Slot[] = level.answers.map((ans) => {
    const word = ans.word.toUpperCase();
    return {
      word,
      row: ans.row,
      col: ans.col,
      dir: ans.dir,
      length: word.length,
      firstLetter: word[0],
      acceptableWords: findAcceptable(word.length, word[0], level.letters),
    };
  });

  // Build cells with backrefs to slots.
  const cellMap = new Map<string, Cell>();
  slots.forEach((slot, slotIdx) => {
    const chars = slot.word.split('');
    for (let i = 0; i < chars.length; i++) {
      const r = slot.dir === 'H' ? slot.row : slot.row + i;
      const c = slot.dir === 'H' ? slot.col + i : slot.col;
      const key = `${r},${c}`;
      const prev = cellMap.get(key);
      if (prev) {
        prev.slotIndexes.push(slotIdx);
        prev.posInSlot.push(i);
      } else {
        cellMap.set(key, {
          row: r,
          col: c,
          letter: chars[i],
          slotIndexes: [slotIdx],
          posInSlot: [i],
        });
      }
    }
  });

  let rows = 0;
  let cols = 0;
  for (const cell of cellMap.values()) {
    rows = Math.max(rows, cell.row + 1);
    cols = Math.max(cols, cell.col + 1);
  }

  return {
    rows,
    cols,
    cells: [...cellMap.values()],
    slots,
    answerWords: slots.map((s) => s.word),
  };
}

/** Find an unfilled slot that accepts `word`. Returns the slot index, or
 *  null if the word doesn't fit any remaining slot. */
export function findSlotForWord(
  layout: LevelLayout,
  filledSlots: Readonly<Record<number, string>>,
  word: string
): number | null {
  const w = word.toUpperCase();
  for (let i = 0; i < layout.slots.length; i++) {
    if (filledSlots[i]) continue;
    if (layout.slots[i].acceptableWords.includes(w)) return i;
  }
  return null;
}

/** Returns true if `word` already fills one of the slots (regardless of
 *  whether the canonical preset was a different word). */
export function isWordAlreadyFilled(
  filledSlots: Readonly<Record<number, string>>,
  word: string
): boolean {
  const w = word.toUpperCase();
  return Object.values(filledSlots).some((v) => v === w);
}
