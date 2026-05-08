import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#FBBF24', '#F87171', '#34D399', '#60A5FA', '#A78BFA'];
const PIECE_COUNT = 60;

interface Props {
  active: boolean;
}

interface PieceConfig {
  startX: number;
  endX: number;
  size: number;
  color: string;
  rotation: number;
  delay: number;
  duration: number;
}

export function Confetti({ active }: Props) {
  const pieces = useRef<PieceConfig[]>(buildConfigs()).current;
  if (!active) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((cfg, i) => (
        <ConfettiPiece key={i} config={cfg} />
      ))}
    </View>
  );
}

function buildConfigs(): PieceConfig[] {
  const { width } = Dimensions.get('window');
  return Array.from({ length: PIECE_COUNT }).map(() => ({
    startX: Math.random() * width,
    endX: Math.random() * width,
    size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 720,
    delay: Math.random() * 400,
    duration: 2200 + Math.random() * 1800,
  }));
}

function ConfettiPiece({ config }: { config: PieceConfig }) {
  const fall = useRef(new Animated.Value(0)).current;
  const { height } = Dimensions.get('window');

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      duration: config.duration,
      delay: config.delay,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [config.delay, config.duration, fall]);

  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, height + 40],
  });
  const translateX = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [config.startX, config.endX],
  });
  const rotate = fall.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${config.rotation}deg`],
  });
  const opacity = fall.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: config.size,
        height: config.size,
        backgroundColor: config.color,
        borderRadius: 2,
        transform: [{ translateX }, { translateY }, { rotate }],
        opacity,
      }}
    />
  );
}
