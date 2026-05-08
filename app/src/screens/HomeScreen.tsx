import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useUnlocks } from '../hooks/useUnlocks';
import { useTheme } from '../theme/ThemeProvider';
import { GradientBackground } from '../components/GradientBackground';
import { AppLogo } from '../components/AppLogo';
import { TopBar } from '../components/TopBar';
import { ThemePickerModal } from '../components/ThemePickerModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const unlocks = useUnlocks();
  const [pickerOpen, setPickerOpen] = useState(false);

  const continueLevel = unlocks.loaded ? unlocks.furthestLevel : 1;
  const continueLabel = unlocks.loaded
    ? t('home.continue', { level: continueLevel })
    : t('home.start');

  // Three-avatar level preview (current ± 1)
  const previewLevels = [
    Math.max(1, continueLevel - 1),
    continueLevel,
    continueLevel + 1,
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />
        <View style={styles.body}>
          {/* Logo + title */}
          <View style={styles.heroWrap}>
            <View style={styles.logoTilt}>
              <AppLogo size={120} />
            </View>
            <Text style={styles.title}>WordScapes</Text>
            <Text style={styles.subtitle}>VOCABULARY · QUEST</Text>
          </View>

          {/* Level path preview → tap to Map */}
          <Pressable
            style={styles.pathCard}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.avatarRow}>
              {previewLevels.map((lvl, i) => {
                const isCurrent = lvl === continueLevel;
                return (
                  <View
                    key={lvl}
                    style={[
                      styles.avatar,
                      i > 0 && styles.avatarOverlap,
                      isCurrent
                        ? { backgroundColor: '#FACC15', zIndex: 2 }
                        : styles.avatarMuted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarLabel,
                        isCurrent && { color: '#0F172A' },
                      ]}
                    >
                      {lvl}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.pathRight}>
              <Text style={styles.pathHint}>下一关</Text>
              <Text style={styles.pathTitle}>地图 ›</Text>
            </View>
          </Pressable>

          {/* Big play button */}
          <Pressable
            style={[styles.playBtn, { backgroundColor: '#FFFFFF' }]}
            onPress={() => navigation.navigate('Game')}
          >
            <Text style={[styles.playLabel, { color: theme.primary }]}>
              ▶  {continueLabel}
            </Text>
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

          <Pressable
            style={styles.themeRow}
            onPress={() => setPickerOpen(true)}
          >
            <Text style={styles.themeRowLabel}>✨  {theme.name}</Text>
            <Text style={styles.themeRowAction}>切换风格 ›</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <ThemePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 16,
  },
  avatarRow: { flexDirection: 'row' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlap: { marginLeft: -10 },
  avatarMuted: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    opacity: 0.6,
  },
  avatarLabel: { fontWeight: '900', color: '#F8FAFC', fontSize: 13 },
  pathRight: { alignItems: 'flex-end' },
  pathHint: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  pathTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
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
  themeRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  themeRowLabel: { color: '#F8FAFC', fontWeight: '800', fontSize: 14 },
  themeRowAction: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
});
