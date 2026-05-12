import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  /** Big emoji shown above the title (e.g. "💡" for hints, "🔥" for streak). */
  icon: string;
  titleKey: string;
  bodyKey: string;
  /** Optional fallback strings used when the i18n keys aren't present. */
  titleFallback?: string;
  bodyFallback?: string;
  onDismiss: () => void;
}

// Lightweight reusable tutorial overlay. Generic version of OnboardingOverlay
// for second/third-order lessons (hint button, streak system, etc). Fade in,
// tap anywhere to dismiss. Persistence handled by caller via AsyncStorage.
export function TutorialOverlay({
  visible,
  icon,
  titleKey,
  bodyKey,
  titleFallback,
  bodyFallback,
  onDismiss,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  // Use a Modal so the backdrop always covers the WHOLE screen.
  // Earlier this was a plain absolute-positioned View, which only
  // covered its nearest positioned ancestor (e.g. TopBar's 56-px row)
  // when rendered from inside TopBar — the streak tutorial ended up
  // overlapping the top icons instead of going fullscreen-modal.
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <Animated.View
          style={[styles.center, { transform: [{ scale }] }]}
          pointerEvents="none"
        >
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{t(titleKey, undefined, titleFallback)}</Text>
          <Text style={styles.body}>{t(bodyKey, undefined, bodyFallback)}</Text>
          <Text style={styles.hint}>
            {t('onboarding.tapToDismiss', undefined, '轻点任意处继续')}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    zIndex: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 24,
    maxWidth: 360,
  },
  icon: { fontSize: 56, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.80)',
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 2,
  },
});
