import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Confetti } from './Confetti';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import type { CheckInStatus, DailyCheckInReward } from '../utils/dailyCheckIn';

interface Props {
  visible: boolean;
  status: CheckInStatus;
  reward: DailyCheckInReward;
  cycleSize: number;
  /** streakDays already on the user before claiming (for the "已签到" cells). */
  currentStreak: number;
  onClaim: () => void;
  onClose: () => void;
}

export function DailyCheckInModal({
  visible,
  status,
  reward,
  cycleSize,
  currentStreak,
  onClaim,
  onClose,
}: Props) {
  const { theme } = useTheme();
  // Offset within the current cycle for the upcoming claim. e.g. cycleSize=7
  // and nextStreak=8 → highlight day 1 of the second week.
  const upcomingDay = ((status.nextStreak - 1) % cycleSize) + 1;
  // Same offset but for the streak the user already has, so we know which
  // cells to mark as "claimed" before today.
  const alreadyDoneInCycle = currentStreak === 0
    ? 0
    : ((currentStreak - 1) % cycleSize) + (status.alreadyClaimed ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Confetti active={visible && status.isMilestone} />
        <View style={styles.card}>
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.title}>
              {t('dailyCheckIn.title', { days: status.nextStreak })}
            </Text>
            <Text style={styles.subtitle}>
              {status.brokeStreak
                ? t('dailyCheckIn.brokeSubtitle')
                : t('dailyCheckIn.subtitle', { day: upcomingDay })}
            </Text>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.cycleRow}>
              {Array.from({ length: cycleSize }, (_, i) => {
                const dayNum = i + 1;
                const isToday = !status.alreadyClaimed && dayNum === upcomingDay;
                const isPast =
                  dayNum <= alreadyDoneInCycle && !(isToday && status.alreadyClaimed);
                const isMilestoneCell = dayNum === cycleSize;
                return (
                  <View
                    key={dayNum}
                    style={[
                      styles.cycleCell,
                      isPast && styles.cyclePast,
                      isToday && [styles.cycleToday, { borderColor: theme.primary }],
                      isMilestoneCell && styles.cycleMilestone,
                    ]}
                  >
                    {isPast ? (
                      <Text style={styles.cycleCheck}>✓</Text>
                    ) : (
                      <Text
                        style={[
                          styles.cycleNum,
                          isToday && { color: theme.primary },
                        ]}
                      >
                        {isMilestoneCell ? '🎁' : dayNum}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.rewards}>
              <RewardRow
                icon="🪙"
                label={t('dailyCheckIn.coinsReward', { coins: reward.coins })}
              />
              {reward.hints > 0 ? (
                <RewardRow
                  icon="💡"
                  label={t('dailyCheckIn.hintsReward', { hints: reward.hints })}
                />
              ) : null}
            </View>

            <Pressable
              style={[
                styles.claimBtn,
                { backgroundColor: theme.primary },
                status.alreadyClaimed && styles.claimDisabled,
              ]}
              onPress={status.alreadyClaimed ? onClose : onClaim}
            >
              <Text style={[styles.claimText, { color: theme.primaryText }]}>
                {status.alreadyClaimed
                  ? t('dailyCheckIn.alreadyClaimed')
                  : t('dailyCheckIn.claim')}
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
      <Text style={styles.rewardLabel}>{label}</Text>
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
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 22,
    marginTop: -2,
  },
  flame: { fontSize: 48, marginBottom: 6 },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  body: { padding: 22, gap: 18 },
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  cycleCell: {
    width: 36,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cyclePast: { backgroundColor: '#DCFCE7' },
  cycleToday: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cycleMilestone: { backgroundColor: '#FEF3C7' },
  cycleNum: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  cycleCheck: { fontSize: 16, fontWeight: '900', color: '#16A34A' },
  rewards: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardIcon: { fontSize: 22 },
  rewardLabel: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  claimBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  claimDisabled: { opacity: 0.5 },
  claimText: { fontSize: 16, fontWeight: '900' },
});
