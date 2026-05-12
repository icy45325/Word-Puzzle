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
  /** Words newly learned in this chapter (target + bonus). Shown as a
   *  scrollable chip row above the claim button. */
  newWords?: string[];
  onClaim: () => void;
}

export function ChapterRewardModal({
  visible,
  chapter,
  coins,
  hints,
  hintCapped,
  newWords,
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
            {newWords && newWords.length > 0 ? (
              <View style={styles.newWordsBlock}>
                <Text style={styles.newWordsLabel}>
                  {t('chapterReward.newWords', { count: newWords.length })}
                </Text>
                <View style={styles.newWordsChips}>
                  {newWords.slice(0, 12).map((w) => (
                    <View key={w} style={styles.newWordChip}>
                      <Text style={styles.newWordChipText}>{w}</Text>
                    </View>
                  ))}
                  {newWords.length > 12 ? (
                    <Text style={styles.newWordsMore}>
                      +{newWords.length - 12}
                    </Text>
                  ) : null}
                </View>
              </View>
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
  newWordsBlock: {
    alignSelf: 'stretch',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  newWordsLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  newWordsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  newWordChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newWordChipText: {
    color: '#FACC15',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  newWordsMore: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'center',
  },
  btn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { fontSize: 17, fontWeight: '900' },
});
