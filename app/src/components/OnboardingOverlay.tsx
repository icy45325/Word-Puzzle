import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

// Lightweight first-launch tutorial: a finger glyph swings between two
// dots to communicate "press, drag across letters, release". Tap anywhere
// to dismiss. Persistence is handled by the caller (GameScreen reads/writes
// the AsyncStorage flag).
export function OnboardingOverlay({ visible, onDismiss }: Props) {
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [visible, x, opacity]);

  if (!visible) return null;

  const translateX = x.interpolate({
    inputRange: [0, 1],
    outputRange: [-72, 72],
  });

  return (
    <Animated.View style={[styles.backdrop, { opacity }]} pointerEvents="auto">
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.title}>
          {t('onboarding.title', undefined, '滑动字母拼出单词')}
        </Text>
        <Text style={styles.subtitle}>
          {t('onboarding.subtitle', undefined, '按住一个字母，依次滑过其他字母，松手提交')}
        </Text>

        <View style={styles.demoRow}>
          <Dot />
          <View style={styles.spacer} />
          <Animated.Text
            style={[styles.finger, { transform: [{ translateX }] }]}
          >
            👆
          </Animated.Text>
          <View style={styles.spacer} />
          <Dot />
        </View>

        <Text style={styles.hint}>
          {t('onboarding.tapToDismiss', undefined, '轻点任意处开始游戏')}
        </Text>
      </View>
    </Animated.View>
  );
}

function Dot() {
  return <View style={styles.dot} />;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 18,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    height: 70,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FACC15',
  },
  spacer: { width: 64 },
  finger: { fontSize: 36 },
  hint: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
  },
});
