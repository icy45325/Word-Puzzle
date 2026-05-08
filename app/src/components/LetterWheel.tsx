import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { runOnJS } from 'react-native-reanimated';

const WHEEL_SIZE = 300;
const TILE_RADIUS = 32;
const HIT_RADIUS = TILE_RADIUS * 1.15;

interface Props {
  letters: string[];
  onSubmit: (word: string) => void;
  onPreview?: (word: string) => void;
}

interface TilePos {
  letter: string;
  index: number;
  x: number;
  y: number;
}

export function LetterWheel({ letters, onSubmit, onPreview }: Props) {
  const tiles = useMemo<TilePos[]>(() => {
    const center = WHEEL_SIZE / 2;
    const orbit = WHEEL_SIZE / 2 - TILE_RADIUS - 6;
    const n = letters.length;
    return letters.map((letter, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return {
        letter,
        index: i,
        x: center + orbit * Math.cos(angle),
        y: center + orbit * Math.sin(angle),
      };
    });
  }, [letters]);

  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const selectedRef = useRef<number[]>([]);

  const commit = useCallback(() => {
    const indexes = selectedRef.current;
    selectedRef.current = [];
    setSelectedIndexes([]);
    setPointer(null);
    if (indexes.length === 0) return;
    const word = indexes.map((i) => letters[i]).join('');
    onSubmit(word);
    onPreview?.('');
  }, [letters, onSubmit, onPreview]);

  const pushIfHit = useCallback(
    (x: number, y: number) => {
      for (const t of tiles) {
        const dx = x - t.x;
        const dy = y - t.y;
        if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) {
          const current = selectedRef.current;
          if (current.includes(t.index)) return;
          const next = [...current, t.index];
          selectedRef.current = next;
          setSelectedIndexes(next);
          onPreview?.(next.map((i) => letters[i]).join(''));
          return;
        }
      }
    },
    [letters, onPreview, tiles]
  );

  const handleUpdate = useCallback(
    (x: number, y: number) => {
      setPointer({ x, y });
      pushIfHit(x, y);
    },
    [pushIfHit]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((e) => {
          runOnJS(handleUpdate)(e.x, e.y);
        })
        .onUpdate((e) => {
          runOnJS(handleUpdate)(e.x, e.y);
        })
        .onEnd(() => {
          runOnJS(commit)();
        })
        .onFinalize(() => {
          runOnJS(commit)();
        }),
    [commit, handleUpdate]
  );

  const polylinePoints = useMemo(() => {
    const pts = selectedIndexes.map((i) => `${tiles[i].x},${tiles[i].y}`);
    if (pointer && selectedIndexes.length > 0) {
      pts.push(`${pointer.x},${pointer.y}`);
    }
    return pts.join(' ');
  }, [pointer, selectedIndexes, tiles]);

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.wheel} collapsable={false}>
        {/* Background ring */}
        <View pointerEvents="none" style={styles.ring} />
        <View pointerEvents="none" style={styles.ringInner} />
        <Svg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {polylinePoints.length > 0 && (
            <Polyline
              points={polylinePoints}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
          {selectedIndexes.map((i) => (
            <Circle
              key={`sel-${i}`}
              cx={tiles[i].x}
              cy={tiles[i].y}
              r={TILE_RADIUS}
              fill="#FFFFFF"
            />
          ))}
        </Svg>
        {tiles.map((t) => {
          const selected = selectedIndexes.includes(t.index);
          return (
            <View
              key={t.index}
              pointerEvents="none"
              style={[
                styles.tile,
                {
                  left: t.x - TILE_RADIUS,
                  top: t.y - TILE_RADIUS,
                  backgroundColor: selected
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.10)',
                  borderColor: selected
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.10)',
                },
              ]}
            >
              <Text
                style={[
                  styles.tileText,
                  { color: selected ? '#0F172A' : '#F8FAFC' },
                ]}
              >
                {t.letter}
              </Text>
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ringInner: {
    position: 'absolute',
    width: WHEEL_SIZE - 24,
    height: WHEEL_SIZE - 24,
    top: 12,
    left: 12,
    borderRadius: (WHEEL_SIZE - 24) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  tile: {
    position: 'absolute',
    width: TILE_RADIUS * 2,
    height: TILE_RADIUS * 2,
    borderRadius: TILE_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  tileText: {
    fontSize: 28,
    fontWeight: '900',
  },
});
