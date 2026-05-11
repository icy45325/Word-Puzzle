import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import type { LeaderboardScope, ScoreRecord } from '../services/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

export function LeaderboardScreen({ navigation }: Props) {
  useLocale();
  const services = useServices();
  const user = useCurrentUser();
  const unlocks = useUnlocks();
  const [scope, setScope] = useState<LeaderboardScope>('self');
  const [rows, setRows] = useState<ScoreRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    services.leaderboard.getTop(scope, 50).then((r) => {
      if (cancelled) return;
      setRows(r);
    });
    return () => {
      cancelled = true;
    };
  }, [services, user, scope]);

  const tabs: { key: LeaderboardScope; label: string; locked?: boolean }[] = [
    { key: 'self', label: t('leaderboard.tabs.self') },
    {
      key: 'friends',
      label: t('leaderboard.tabs.friends'),
      locked: !unlocks.friendsLeaderboard,
    },
    {
      key: 'global',
      label: t('leaderboard.tabs.global'),
      locked: !unlocks.globalLeaderboard,
    },
  ];

  const showComingSoon = scope !== 'self';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title}>排行榜</Text>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                scope === tab.key && styles.tabActive,
                tab.locked && styles.tabLocked,
              ]}
              onPress={() => setScope(tab.key)}
            >
              <Text
                style={[styles.tabLabel, scope === tab.key && styles.tabLabelActive]}
              >
                {tab.locked ? '🔒 ' : ''}
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {showComingSoon ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{t('leaderboard.comingSoon')}</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{t('leaderboard.empty')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((r, idx) => (
              <View key={r.scoreId} style={styles.row}>
                <Text style={styles.rank}>{idx + 1}</Text>
                <Text style={styles.level}>{r.levelId}</Text>
                <Text style={styles.score}>{r.score}</Text>
              </View>
            ))}
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#F8FAFC', marginTop: -3 },
  title: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.5 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: { backgroundColor: '#FACC15', borderColor: '#FACC15' },
  tabLocked: { opacity: 0.55 },
  tabLabel: { fontSize: 13, fontWeight: '800', color: '#F8FAFC' },
  tabLabelActive: { color: '#0F172A' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontStyle: 'italic' },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rank: { width: 28, fontSize: 16, fontWeight: '900', color: '#FACC15' },
  level: { flex: 1, fontSize: 14, color: '#F8FAFC', fontWeight: '700' },
  score: { fontSize: 18, fontWeight: '900', color: '#FACC15' },
});
