import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { useEconomy } from '../hooks/useEconomy';
import { useUnlocks } from '../hooks/useUnlocks';
import { t } from '../i18n';

export function ProfileScreen() {
  const services = useServices();
  const user = useCurrentUser();
  const { state } = useEconomy();
  const unlocks = useUnlocks();
  const [learnedCount, setLearnedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    services.learnedWords.list(user.userId).then((list) => {
      if (cancelled) return;
      setLearnedCount(list.length);
    });
    return () => {
      cancelled = true;
    };
  }, [services, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
          <Text style={styles.sub}>
            {user?.isAnonymous ? t('profile.guest') : 'Signed in'}
          </Text>
          <View style={styles.statsGrid}>
            <Stat label={t('profile.coins')} value={`${state?.coins ?? 0}`} />
            <Stat label={t('profile.hints')} value={`${state?.hints ?? 0}`} />
            <Stat
              label={t('profile.furthest')}
              value={`L${unlocks.furthestLevel}`}
            />
            <Stat label={t('profile.learnedCount')} value={`${learnedCount}`} />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.linkBtn}
            disabled={!user?.isAnonymous}
            onPress={() => {
              // Login route is added in step 7
            }}
          >
            <Text style={styles.linkText}>
              🔗 {user?.isAnonymous ? t('profile.linkAccount') : t('profile.signOut')}
            </Text>
          </Pressable>
          <Text style={styles.actionHint}>{t('login.googleHint')}</Text>
        </View>
      </View>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  content: { padding: 24, gap: 16 },
  card: {
    backgroundColor: '#1C3D57',
    borderRadius: 14,
    padding: 20,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#F7F9FC' },
  sub: { marginTop: 4, color: '#9AB8CF', fontSize: 13 },
  statsGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  stat: { minWidth: 100 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#F7C948' },
  statLabel: { fontSize: 12, color: '#9AB8CF', marginTop: 2 },
  actions: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  linkBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  linkText: { color: '#F7C948', fontSize: 15, fontWeight: '600' },
  actionHint: { color: '#6B8AA5', fontSize: 12, paddingHorizontal: 12 },
});
