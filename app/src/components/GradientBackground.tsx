import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props) {
  const { theme } = useTheme();
  const blobTopAnim = useRef(new Animated.Value(0)).current;
  const blobBottomAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    const a = loop(blobTopAnim, 14000);
    const b = loop(blobBottomAnim, 18000);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [blobTopAnim, blobBottomAnim]);

  const topTranslateX = blobTopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });
  const topTranslateY = blobTopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });
  const bottomTranslateX = blobBottomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });
  const bottomTranslateY = blobBottomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, string]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobTop,
          {
            transform: [
              { translateX: topTranslateX },
              { translateY: topTranslateY },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBottom,
          {
            transform: [
              { translateX: bottomTranslateX },
              { translateY: bottomTranslateY },
            ],
          },
        ]}
      />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blobTop: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 360,
    backgroundColor: 'rgba(96, 165, 250, 0.18)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 420,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
  },
});
