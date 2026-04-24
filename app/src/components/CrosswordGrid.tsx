import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Cell, LevelLayout } from '../utils/gridLayout';

const CELL_SIZE = 44;
const GAP = 6;

interface Props {
  layout: LevelLayout;
  foundWords: string[];
}

export function CrosswordGrid({ layout, foundWords }: Props) {
  const foundSet = useMemo(() => new Set(foundWords.map((w) => w.toUpperCase())), [foundWords]);

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
            const revealed = cell.answerWords.some((w) => foundSet.has(w));
            return (
              <View
                key={`c${r}-${c}`}
                style={[styles.cell, revealed ? styles.cellRevealed : styles.cellHidden]}
              >
                {revealed ? (
                  <Text style={styles.letter}>{cell.letter}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
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
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellHidden: {
    backgroundColor: '#1C3D57',
  },
  cellRevealed: {
    backgroundColor: '#F7F9FC',
  },
  empty: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    marginRight: GAP,
  },
  letter: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F2A3F',
  },
});
