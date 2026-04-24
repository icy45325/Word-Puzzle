import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser } from '../services';
import { useEconomy } from '../hooks/useEconomy';
import { t } from '../i18n';

export function ProfileScreen() {
  const user = useCurrentUser();
  const { state } = useEconomy();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <View style={styles.card}>
          <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
          <Text style={styles.sub}>
            {user?.isAnonymous ? t('profile.guest') : 'Signed in'}
          </Text>
          <View style={styles.statsRow}>
            <Stat label={t('profile.coins')} value={`${state?.coins ?? 0}`} />
            <Stat label={t('profile.streak')} value={`${state?.streakDays ?? 0}`} />
          </View>
        </View>
        <View style={styles.futureCard}>
          <Text style={styles.futureItem}>🔗  {t('profile.linkAccount')}</Text>
          <Text style={styles.futureItem}>🏆  {t('profile.leaderboard')}</Text>
          <Text style={styles.futureItem}>🛒  {t('profile.store')}</Text>
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
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#F7C948', marginBottom: 16 },
  card: {
    backgroundColor: '#1C3D57',
    borderRadius: 14,
    padding: 20,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#F7F9FC' },
  sub: { marginTop: 4, color: '#9AB8CF', fontSize: 13 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 32 },
  stat: {},
  statValue: { fontSize: 22, fontWeight: '800', color: '#F7C948' },
  statLabel: { fontSize: 12, color: '#9AB8CF', marginTop: 2 },
  futureCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  futureItem: { color: '#9AB8CF', fontSize: 15 },
});
