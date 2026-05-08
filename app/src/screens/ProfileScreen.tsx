import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { useEconomy } from '../hooks/useEconomy';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { state } = useEconomy();
  const unlocks = useUnlocks();
  const { theme } = useTheme();
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
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

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

          <Pressable
            style={[styles.linkBtn, { backgroundColor: theme.primary }]}
            onPress={async () => {
              if (user?.isAnonymous) {
                navigation.navigate('Login');
              } else {
                await services.auth.signOut();
              }
            }}
          >
            <Text style={[styles.linkText, { color: theme.primaryText }]}>
              🔗 {user?.isAnonymous ? t('profile.linkAccount') : t('profile.signOut')}
            </Text>
          </Pressable>
          <Text style={styles.actionHint}>{t('login.googleHint')}</Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
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
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  name: { fontSize: 22, fontWeight: '900', color: '#F8FAFC' },
  sub: { marginTop: 4, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  statsGrid: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  stat: { minWidth: 100 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#FACC15' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '700', letterSpacing: 1 },
  linkBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  linkText: { fontSize: 15, fontWeight: '900' },
  actionHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    paddingHorizontal: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
});
