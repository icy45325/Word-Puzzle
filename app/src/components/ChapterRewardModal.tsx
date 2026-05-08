import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Confetti } from './Confetti';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  chapter: number;
  coins: number;
  hints: number;
  hintCapped: boolean;
  onClaim: () => void;
}

export function ChapterRewardModal({
  visible,
  chapter,
  coins,
  hints,
  hintCapped,
  onClaim,
}: Props) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Confetti active={visible} />
        <View style={styles.card}>
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.medal}>🏅</Text>
            <Text style={styles.title}>
              {t('chapterReward.title', { chapter })}
            </Text>
          </LinearGradient>
          <View style={styles.body}>
            <View style={styles.rewards}>
              <RewardRow icon="🪙" label={t('chapterReward.coins', { coins })} />
              {hints > 0 ? (
                <RewardRow icon="💡" label={t('chapterReward.hints', { hints })} />
              ) : null}
            </View>
            {hintCapped ? (
              <Text style={styles.cap}>{t('chapterReward.cap')}</Text>
            ) : null}
            <Pressable
              style={[styles.btn, { backgroundColor: theme.primary }]}
              onPress={onClaim}
            >
              <Text style={[styles.btnText, { color: theme.primaryText }]}>
                {t('chapterReward.next')} ▶
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RewardRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.rewardRow}>
      <Text style={styles.rewardIcon}>{icon}</Text>
      <Text style={styles.rewardText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  medal: { fontSize: 56, marginBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  body: { padding: 24, gap: 12, alignItems: 'center' },
  rewards: { alignSelf: 'stretch', gap: 10 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rewardIcon: { fontSize: 22 },
  rewardText: { fontSize: 16, fontWeight: '900', color: '#FACC15' },
  cap: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  btn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { fontSize: 17, fontWeight: '900' },
});
