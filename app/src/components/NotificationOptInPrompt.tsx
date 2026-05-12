import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  /** Called when the user taps "开启提醒". The caller wires this to the
   *  notifications service permission request flow. */
  onAllow: () => void;
  /** Called when the user taps "稍后再说" or the backdrop. The caller is
   *  expected to persist a "don't ask again" flag so this doesn't pop on
   *  every subsequent level-complete. */
  onDismiss: () => void;
}

// Soft opt-in nudge that surfaces after the user has played at least one
// level. This is shown BEFORE the system permission dialog so we get a
// chance to explain the value first; tapping "开启提醒" then triggers the
// real OS prompt. Tapping the backdrop or "稍后再说" closes silently and
// (per caller) suppresses the prompt forever via AsyncStorage.
export function NotificationOptInPrompt({
  visible,
  onAllow,
  onDismiss,
}: Props) {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.card}>
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.bell}>🔔</Text>
            <Text style={styles.title}>
              {t('notifOptIn.title', undefined, '想让我提醒你回来吗？')}
            </Text>
            <Text style={styles.subtitle}>
              {t(
                'notifOptIn.subtitle',
                undefined,
                '每天 10 点 1 条签到提醒 + 1 条复习提醒，断了连胜会单独喊你。'
              )}
            </Text>
          </LinearGradient>
          <View style={styles.body}>
            <Pressable
              style={[styles.allowBtn, { backgroundColor: theme.primary }]}
              onPress={onAllow}
            >
              <Text style={[styles.allowText, { color: theme.primaryText }]}>
                {t('notifOptIn.allow', undefined, '开启提醒')}
              </Text>
            </Pressable>
            <Pressable style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissText}>
                {t('notifOptIn.dismiss', undefined, '稍后再说')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.78)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
  },
  bell: { fontSize: 44, marginBottom: 6 },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 19,
  },
  body: { padding: 20, gap: 10 },
  allowBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  allowText: { fontSize: 15, fontWeight: '900' },
  dismissBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
