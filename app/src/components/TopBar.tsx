import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys as storageKeys } from '../store/storage';
import { useEconomy } from '../hooks/useEconomy';
import { useDailyCheckIn } from '../hooks/useDailyCheckIn';
import { ThemePickerModal } from './ThemePickerModal';
import { DailyCheckInModal } from './DailyCheckInModal';
import { TutorialOverlay } from './TutorialOverlay';

export function TopBar() {
  const { state } = useEconomy();
  const [picker, setPicker] = useState(false);
  const dailyCheckIn = useDailyCheckIn();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [streakTutorialOpen, setStreakTutorialOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  // Auto-open once per app session the first time the daily check-in
  // hook reports that today hasn't been claimed yet. Subsequent screen
  // mounts won't re-open.
  useEffect(() => {
    if (!dailyCheckIn.loaded) return;
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    if (!dailyCheckIn.status.alreadyClaimed) {
      setCheckInOpen(true);
    }
  }, [dailyCheckIn.loaded, dailyCheckIn.status.alreadyClaimed]);

  const handleClaim = async () => {
    await dailyCheckIn.claim();
    setCheckInOpen(false);
    // First-claim streak tutorial — explains the streak mechanic right
    // after the player sees their first +N coins reward.
    const seen = await AsyncStorage.getItem(storageKeys.onboarding('streak'));
    if (!seen) {
      setTimeout(() => setStreakTutorialOpen(true), 600);
    }
  };

  const dismissStreakTutorial = () => {
    setStreakTutorialOpen(false);
    AsyncStorage.setItem(storageKeys.onboarding('streak'), '1').catch(
      () => undefined
    );
  };

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.pill}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.value}>{state?.coins ?? 0}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.icon}>💡</Text>
          <Text style={styles.value}>{state?.hints ?? 0}</Text>
        </View>
        {dailyCheckIn.loaded ? (
          <Pressable
            style={[styles.pill, styles.streakPill]}
            onPress={() => setCheckInOpen(true)}
          >
            <Text style={styles.icon}>🔥</Text>
            <Text style={styles.streakValue}>{dailyCheckIn.currentStreak}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable style={styles.themeBtn} onPress={() => setPicker(true)}>
        <Text style={styles.themeIcon}>🎨</Text>
      </Pressable>
      <ThemePickerModal visible={picker} onClose={() => setPicker(false)} />
      <DailyCheckInModal
        visible={checkInOpen}
        status={dailyCheckIn.status}
        reward={dailyCheckIn.reward}
        cycleSize={dailyCheckIn.cycleSize}
        currentStreak={dailyCheckIn.currentStreak}
        onClaim={handleClaim}
        onClose={() => setCheckInOpen(false)}
      />
      <TutorialOverlay
        visible={streakTutorialOpen}
        icon="🔥"
        titleKey="tutorial.streak.title"
        bodyKey="tutorial.streak.body"
        titleFallback="连胜越长，奖励越多"
        bodyFallback="每天来签到金币和提示都翻倍涨。连续 7 天送大礼包，断了重新开始～"
        onDismiss={dismissStreakTutorial}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  left: { flex: 1, flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  streakPill: {
    backgroundColor: 'rgba(250,204,21,0.18)',
    borderColor: 'rgba(250,204,21,0.40)',
  },
  icon: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '900', color: '#F8FAFC' },
  streakValue: { fontSize: 14, fontWeight: '900', color: '#FACC15' },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: { fontSize: 18 },
});
