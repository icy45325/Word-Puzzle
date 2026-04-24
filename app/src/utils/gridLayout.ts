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
  letter: string;
  answerWords: string[]; // words this cell belongs to
}

export interface LevelLayout {
  rows: number;
  cols: number;
  cells: Cell[];
  answerWords: string[];
}

export function layoutLevel(level: LevelDef): LevelLayout {
  const cellMap = new Map<string, Cell>();
  for (const ans of level.answers) {
    const chars = ans.word.toUpperCase().split('');
    for (let i = 0; i < chars.length; i++) {
      const r = ans.dir === 'H' ? ans.row : ans.row + i;
      const c = ans.dir === 'H' ? ans.col + i : ans.col;
      const key = `${r},${c}`;
      const prev = cellMap.get(key);
      if (prev) {
        prev.answerWords.push(ans.word.toUpperCase());
      } else {
        cellMap.set(key, {
          row: r,
          col: c,
          letter: chars[i],
          answerWords: [ans.word.toUpperCase()],
        });
      }
    }
  }
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
    answerWords: level.answers.map((a) => a.word.toUpperCase()),
  };
}

export function cellsForWord(
  layout: LevelLayout,
  word: string
): Cell[] {
  const w = word.toUpperCase();
  return layout.cells.filter((c) => c.answerWords.includes(w));
}
