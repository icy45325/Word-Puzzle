import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { Cell, LevelLayout } from '../utils/gridLayout';

const CELL_SIZE = 44;
const GAP = 6;

interface Props {
  layout: LevelLayout;
  foundWords: string[];
  revealedCells?: Record<string, true>;
}

export function CrosswordGrid({ layout, foundWords, revealedCells }: Props) {
  const foundSet = useMemo(
    () => new Set(foundWords.map((w) => w.toUpperCase())),
    [foundWords]
  );

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
            const fromFound = cell.answerWords.some((w) => foundSet.has(w));
            const fromHint = !!revealedCells?.[`${cell.row},${cell.col}`];
            const revealed = fromFound || fromHint;
            return (
              <AnimatedCell
                key={`c${r}-${c}`}
                cell={cell}
                revealed={revealed}
                fromFound={fromFound}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

interface AnimatedCellProps {
  cell: Cell;
  revealed: boolean;
  fromFound: boolean;
}

function AnimatedCell({ cell, revealed, fromFound }: AnimatedCellProps) {
  const scale = useRef(new Animated.Value(revealed ? 1 : 0.85)).current;
  const wasRevealed = useRef(revealed);

  useEffect(() => {
    if (!wasRevealed.current && revealed) {
      // pop: 0.5 → overshoot 1.15 → settle at 1
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
          {cell.letter}
        </Text>
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
});
