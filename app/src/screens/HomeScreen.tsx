import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useUnlocks } from '../hooks/useUnlocks';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const unlocks = useUnlocks();
  const continueLabel = unlocks.loaded
    ? t('home.continue', { level: unlocks.furthestLevel })
    : t('home.start');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        <Text style={styles.tagline}>{t('home.tagline')}</Text>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.primaryText}>{continueLabel}</Text>
        </Pressable>

        <View style={styles.menu}>
          <MenuItem
            icon="📖"
            label={t('home.vocabulary')}
            unlocked={unlocks.vocabulary}
            unlockText={t('home.locked.atLevel', {
              level: unlocks.vocabularyAtLevel,
            })}
            onPress={() => navigation.navigate('Vocabulary')}
          />
          <MenuItem
            icon="🏆"
            label={t('home.leaderboard')}
            unlocked={unlocks.globalLeaderboard}
            unlockText={t('home.locked.atLevel', {
              level: unlocks.globalLeaderboardAtLevel,
            })}
            onPress={() => navigation.navigate('Leaderboard')}
          />
          <MenuItem
            icon="👥"
            label={t('home.friends')}
            unlocked={unlocks.friendsLeaderboard}
            unlockText={t('home.locked.atLevel', {
              level: unlocks.friendsLeaderboardAtLevel,
            })}
            onPress={() => navigation.navigate('Friends')}
          />
          <MenuItem
            icon="👤"
            label={t('home.profile')}
            unlocked={true}
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

interface MenuProps {
  icon: string;
  label: string;
  unlocked: boolean;
  unlockText?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, unlocked, unlockText, onPress }: MenuProps) {
  return (
    <Pressable
      style={[styles.menuItem, !unlocked && styles.menuItemLocked]}
      onPress={unlocked ? onPress : undefined}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuTextWrap}>
        <Text style={styles.menuLabel}>{label}</Text>
        {!unlocked && unlockText ? (
          <Text style={styles.menuHint}>🔒 {unlockText}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F7C948',
    letterSpacing: 2,
  },
  subtitle: { marginTop: 6, fontSize: 14, color: '#CFE3F5' },
  tagline: {
    marginTop: 18,
    fontSize: 13,
    color: '#9AB8CF',
    lineHeight: 20,
    maxWidth: 320,
  },
  primaryBtn: {
    marginTop: 36,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#F7C948',
    borderRadius: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  primaryText: { fontSize: 18, fontWeight: '800', color: '#0F2A3F' },
  menu: {
    marginTop: 28,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3D57',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 14,
  },
  menuItemLocked: {
    opacity: 0.55,
  },
  menuIcon: { fontSize: 20 },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#F7F9FC' },
  menuHint: { marginTop: 2, fontSize: 12, color: '#9AB8CF' },
});
