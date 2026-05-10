import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Confetti } from './Confetti';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import type { PraiseKeys } from '../utils/praise';

interface Props {
  visible: boolean;
  /** Display label for the level, e.g. "Level 6". */
  levelLabel: string;
  /** Praise tier + i18n keys, computed by GameScreen on level complete. */
  praise: PraiseKeys | null;
  wordsFound: number;
  totalWords: number;
  coinsEarned?: number;
  totalCoins?: number;
  onNext: () => void;
  nextDisabled?: boolean;
  nextDisabledLabel?: string;
}

export function LevelCompleteModal({
  visible,
  levelLabel,
  praise,
  wordsFound,
  totalWords,
  coinsEarned = 25,
  totalCoins,
  onNext,
  nextDisabled,
  nextDisabledLabel,
}: Props) {
  const { theme } = useTheme();
  const title = praise
    ? t(praise.titleKey, undefined, '卓越！')
    : t('levelComplete.titleFallback', undefined, '卓越！');
  const subtitle = praise
    ? t(praise.subtitleKey, undefined, '')
    : '';
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
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.praiseSub}>{subtitle}</Text> : null}
            <Text style={styles.subtitle}>
              {levelLabel} · {t('levelComplete.cleared', undefined, '关卡完成')}
            </Text>
          </LinearGradient>
          <View style={styles.body}>
            <View style={styles.statsRow}>
              <Stat
                label={t('levelComplete.statAnswers', undefined, '答案')}
                value={`${wordsFound}/${totalWords}`}
              />
              <View style={styles.divider} />
              <Stat
                label={t('levelComplete.statReward', undefined, '奖励')}
                value={`+${coinsEarned} 💰`}
              />
            </View>
            {typeof totalCoins === 'number' ? (
              <Text style={styles.totalCoins}>
                {t('levelComplete.totalCoins', { coins: totalCoins }, `总金币 ${totalCoins} 💰`)}
              </Text>
            ) : null}
            <Pressable
              style={[
                styles.nextBtn,
                { backgroundColor: theme.primary },
                nextDisabled && styles.nextBtnDisabled,
              ]}
              onPress={onNext}
              disabled={nextDisabled}
            >
              <Text style={[styles.nextText, { color: theme.primaryText }]}>
                {nextDisabled
                  ? nextDisabledLabel ?? t('levelComplete.allDone', undefined, '已通关 All Done')
                  : t('levelComplete.next', undefined, '继续冒险 ▶')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  trophy: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, textAlign: 'center' },
  praiseSub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  subtitle: { marginTop: 6, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  body: { padding: 24, alignItems: 'center', gap: 16 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  statLabel: { marginTop: 2, fontSize: 11, color: '#64748B', fontWeight: '700' },
  divider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
  totalCoins: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  nextBtn: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { fontSize: 17, fontWeight: '900' },
});
