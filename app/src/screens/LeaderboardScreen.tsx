import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { useUnlocks } from '../hooks/useUnlocks';
import { t } from '../i18n';
import type { LeaderboardScope, ScoreRecord } from '../services/types';

export function LeaderboardScreen() {
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1C3D57',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#F7C948' },
  tabLocked: { opacity: 0.55 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#CFE3F5' },
  tabLabelActive: { color: '#0F2A3F' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: { fontSize: 14, color: '#9AB8CF', textAlign: 'center' },
  list: { paddingHorizontal: 16, gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3D57',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 14,
  },
  rank: { width: 28, fontSize: 14, fontWeight: '800', color: '#F7C948' },
  level: { flex: 1, fontSize: 14, color: '#F7F9FC' },
  score: { fontSize: 16, fontWeight: '700', color: '#F7C948' },
});
