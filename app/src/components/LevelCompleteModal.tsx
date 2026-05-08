import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Confetti } from './Confetti';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  visible: boolean;
  levelId: string;
  wordsFound: number;
  totalWords: number;
  bonusCount: number;
  coinsEarned?: number;
  totalCoins?: number;
  onNext: () => void;
  nextDisabled?: boolean;
  nextDisabledLabel?: string;
}

export function LevelCompleteModal({
  visible,
  levelId,
  wordsFound,
  totalWords,
  bonusCount,
  coinsEarned = 25,
  totalCoins,
  onNext,
  nextDisabled,
  nextDisabledLabel,
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
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.title}>卓越！</Text>
            <Text style={styles.subtitle}>{levelId} · 关卡完成</Text>
          </LinearGradient>
          <View style={styles.body}>
            <View style={styles.statsRow}>
              <Stat label="答案" value={`${wordsFound}/${totalWords}`} />
              <View style={styles.divider} />
              <Stat label="额外" value={`${bonusCount}`} />
              <View style={styles.divider} />
              <Stat label="奖励" value={`+${coinsEarned} 💰`} />
            </View>
            {typeof totalCoins === 'number' ? (
              <Text style={styles.totalCoins}>
                总金币 {totalCoins} 💰
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
                  ? nextDisabledLabel ?? '已通关 All Done'
                  : '继续冒险 ▶'}
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
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  subtitle: { marginTop: 4, fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
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
