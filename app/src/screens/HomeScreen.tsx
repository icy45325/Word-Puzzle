import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useUnlocks } from '../hooks/useUnlocks';
import { useCurrentUser, useServices } from '../services';
import { useTheme } from '../theme/ThemeProvider';
import { GradientBackground } from '../components/GradientBackground';
import { AppLogo } from '../components/AppLogo';
import { ShimmerOverlay } from '../components/ShimmerOverlay';
import { TopBar } from '../components/TopBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  useLocale();
  const { theme } = useTheme();
  const services = useServices();
  const user = useCurrentUser();
  const unlocks = useUnlocks();
  const [dueCount, setDueCount] = useState(0);

  const refreshDue = React.useCallback(() => {
    if (!user) return;
    services.learnedWords
      .getDue(user.userId)
      .then((due) => setDueCount(due.length));
  }, [services, user]);

  useEffect(() => {
    refreshDue();
  }, [refreshDue]);

  // Re-pull on focus so finishing a quiz / round drops the badge AND
  // the unlocks/continue level reflects the just-completed round.
  useFocusEffect(React.useCallback(() => {
    refreshDue();
    unlocks.refresh();
  }, [refreshDue, unlocks]));

  const continueLevel = unlocks.loaded ? unlocks.furthestLevel : 1;
  const continueLabel = unlocks.loaded
    ? t('home.continue', { level: continueLevel })
    : t('home.start');

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + title */}
          <View style={styles.heroWrap}>
            <View style={styles.logoTilt}>
              <AppLogo size={120} />
            </View>
            <Text style={styles.title}>WordScapes</Text>
            <Text style={styles.subtitle}>VOCABULARY · QUEST</Text>
          </View>

          {/* Map entry — single button, no avatar preview to avoid
              ambiguous "current ± 1" highlighting at low levels */}
          <Pressable
            style={styles.pathCard}
            onPress={() => navigation.navigate('Map')}
          >
            <Text style={styles.pathIcon}>🗺</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathTitle}>{t('home.mapTitle')}</Text>
              <Text style={styles.pathHint}>
                {t('home.mapHint', { level: continueLevel })}
              </Text>
            </View>
            <Text style={styles.pathArrow}>›</Text>
          </Pressable>

          {/* Daily review nudge — only when there are due words */}
          {dueCount > 0 ? (
            <Pressable
              style={styles.reviewCta}
              onPress={() => navigation.navigate('ReviewQuiz')}
            >
              <Text style={styles.reviewIcon}>📚</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewTitle}>
                  {t('home.reviewCta', { count: dueCount })}
                </Text>
                <Text style={styles.reviewHint}>{t('home.reviewCtaHint')}</Text>
              </View>
              <Text style={styles.reviewArrow}>›</Text>
            </Pressable>
          ) : null}

          {/* Big play button with subtle shimmer sweep */}
          <Pressable
            style={[styles.playBtn, { backgroundColor: '#FFFFFF' }]}
            onPress={() => navigation.navigate('Game')}
          >
            <Text style={[styles.playLabel, { color: theme.primary }]}>
              ▶  {continueLabel}
            </Text>
            <ShimmerOverlay borderRadius={28} intensity={0.55} />
          </Pressable>

          {/* 2x2 menu */}
          <View style={styles.grid}>
            <MenuTile
              icon="📖"
              label={t('home.vocabulary')}
              unlocked={unlocks.vocabulary}
              unlockText={t('home.locked.atLevel', {
                level: unlocks.vocabularyAtLevel,
              })}
              onPress={() => navigation.navigate('Vocabulary')}
            />
            <MenuTile
              icon="🏆"
              label={t('home.leaderboard')}
              unlocked={unlocks.globalLeaderboard}
              unlockText={t('home.locked.atLevel', {
                level: unlocks.globalLeaderboardAtLevel,
              })}
              onPress={() => navigation.navigate('Leaderboard')}
            />
            <MenuTile
              icon="👥"
              label={t('home.friends')}
              unlocked={unlocks.friendsLeaderboard}
              unlockText={t('home.locked.atLevel', {
                level: unlocks.friendsLeaderboardAtLevel,
              })}
              onPress={() => navigation.navigate('Friends')}
            />
            <MenuTile
              icon="👤"
              label={t('home.profile')}
              unlocked
              onPress={() => navigation.navigate('Profile')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

interface TileProps {
  icon: string;
  label: string;
  unlocked: boolean;
  unlockText?: string;
  onPress: () => void;
}

function MenuTile({ icon, label, unlocked, unlockText, onPress }: TileProps) {
  return (
    <Pressable
      style={[styles.tile, !unlocked && styles.tileLocked]}
      onPress={unlocked ? onPress : undefined}
    >
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {!unlocked && unlockText ? (
        <Text style={styles.tileLock}>🔒 {unlockText}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  heroWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  logoTilt: {
    transform: [{ rotate: '-6deg' }],
  },
  title: {
    marginTop: 18,
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 12,
    gap: 14,
  },
  pathIcon: { fontSize: 26 },
  pathTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pathHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
  },
  pathArrow: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    opacity: 0.5,
  },
  reviewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: 'rgba(34, 197, 94, 0.40)',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 12,
    gap: 12,
  },
  reviewIcon: { fontSize: 28 },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  reviewHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  reviewArrow: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    opacity: 0.6,
  },
  playBtn: {
    paddingVertical: 22,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
    overflow: 'hidden',
  },
  playLabel: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    aspectRatio: 1.4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  tileLocked: { opacity: 0.55 },
  tileIcon: { fontSize: 22 },
  tileLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tileLock: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
});
