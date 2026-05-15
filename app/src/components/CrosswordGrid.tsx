import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { Cell, LevelLayout } from '../utils/gridLayout';

const CELL_SIZE = 44;
const GAP = 6;

interface Props {
  layout: LevelLayout;
  /** slotIndex → word the player filled in (may differ from the preset). */
  filledSlots: Record<number, string>;
  revealedCells?: Record<string, true>;
}

export function CrosswordGrid({ layout, filledSlots, revealedCells }: Props) {
  const cellLetter = useMemo(() => {
    const map = new Map<string, string>();
    for (const cell of layout.cells) {
      const key = `${cell.row},${cell.col}`;
      let resolved: string | null = null;
      for (let i = 0; i < cell.slotIndexes.length; i++) {
        const sIdx = cell.slotIndexes[i];
        const filled = filledSlots[sIdx];
        if (filled) {
          resolved = filled[cell.posInSlot[i]] ?? null;
          break;
        }
      }
      map.set(key, resolved ?? cell.letter);
    }
    return map;
  }, [layout, filledSlots]);

  // For each cell that's the START of an unfilled slot, record the slot's
  // direction. Renderer uses this to draw a → / ↓ hint inside the cell so
  // the player knows which way the word goes (two adjacent horizontal
  // cells that are actually part of different vertical slots no longer
  // look like a 2-letter horizontal word).
  const cellArrow = useMemo(() => {
    const map = new Map<string, 'H' | 'V'>();
    for (let i = 0; i < layout.slots.length; i++) {
      if (filledSlots[i]) continue;
      const slot = layout.slots[i];
      const key = `${slot.row},${slot.col}`;
      // If a cell is the start of two unfilled slots (corner shared by
      // mother H + secondary V), only show the secondary's direction
      // since the mother's direction is usually obvious (longest row).
      // We bias toward V which is the less-obvious one.
      const existing = map.get(key);
      if (!existing || slot.dir === 'V') map.set(key, slot.dir);
    }
    return map;
  }, [layout, filledSlots]);

  const grid: (Cell | null)[][] = useMemo(() => {
    const rows: (Cell | null)[][] = Array.from({ length: layout.rows }, () =>
      Array.from({ length: layout.cols }, () => null)
    );
    for (const c of layout.cells) {
      rows[c.row][c.col] = c;
    }
    return rows;
  }, [layout]);

  return (
    <View style={styles.container}>
      {grid.map((row, r) => (
        <View key={`r${r}`} style={styles.row}>
          {row.map((cell, c) => {
            if (!cell) {
              return <View key={`c${r}-${c}`} style={styles.empty} />;
            }
            const key = `${cell.row},${cell.col}`;
            const fromFound = cell.slotIndexes.some((sIdx) => filledSlots[sIdx]);
            const fromHint = !!revealedCells?.[key];
            const revealed = fromFound || fromHint;
            const letter = cellLetter.get(key) ?? cell.letter;
            const arrow = cellArrow.get(key);
            return (
              <AnimatedCell
                key={`c${r}-${c}`}
                letter={letter}
                revealed={revealed}
                fromFound={fromFound}
                arrow={revealed ? undefined : arrow}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface AnimatedCellProps {
  letter: string;
  revealed: boolean;
  fromFound: boolean;
  /** When this cell is the start of an unfilled slot, the slot's
   *  direction is passed in so we can draw a small arrow inside the
   *  cell. Helps players see that two adjacent cells aren't always a
   *  shared horizontal word — sometimes each cell is the start of a
   *  separate vertical word. */
  arrow?: 'H' | 'V';
}

function AnimatedCell({ letter, revealed, fromFound, arrow }: AnimatedCellProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const wasRevealed = useRef(revealed);

  useEffect(() => {
    if (!wasRevealed.current && revealed) {
      scale.setValue(0.5);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
    wasRevealed.current = revealed;
  }, [revealed, scale]);

  return (
    <Animated.View
      style={[
        styles.cell,
        revealed
          ? fromFound
            ? styles.cellRevealed
            : styles.cellHinted
          : styles.cellHidden,
        { transform: [{ scale }] },
      ]}
    >
      {revealed ? (
        <Text
          style={[
            styles.letter,
            fromFound ? styles.letterFound : styles.letterHinted,
          ]}
        >
          {letter}
        </Text>
      ) : arrow ? (
        <Text style={styles.arrow}>{arrow === 'H' ? '→' : '↓'}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginRight: GAP,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cellHidden: {
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  cellRevealed: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cellHinted: {
    backgroundColor: '#FACC15',
  },
  empty: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginRight: GAP,
  },
  letter: {
    fontSize: 22,
    fontWeight: '900',
  },
  letterFound: { color: '#0F172A' },
  letterHinted: { color: '#0F172A' },
  arrow: {
    fontSize: 16,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
  },
});
