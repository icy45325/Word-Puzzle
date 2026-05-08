import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ children, style }: Props) {
  const { theme } = useTheme();
  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, string]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Soft mesh dots overlay (kept lightweight: just two off-screen blobs) */}
      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobBottom} />
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
