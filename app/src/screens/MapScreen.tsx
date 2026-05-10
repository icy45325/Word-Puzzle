import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentUser, useServices } from '../services';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { t } from '../i18n';
import levelsJson from '../data/levels.json';
import type { LevelDef } from '../utils/gridLayout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const LEVELS = (levelsJson as { levels: (LevelDef & { chapter?: number })[] }).levels;

// Vertical pitch between consecutive nodes (node height + gap from styles).
const NODE_PITCH = 84 + 28;

// First level number of each chapter (1-based). Used to anchor the chapter
// header band so we don't repeat "第N章" on every node.
const CHAPTER_STARTS = (() => {
  const seen = new Set<number>();
  const starts: { chapter: number; oneBased: number }[] = [];
  LEVELS.forEach((lvl, i) => {
    if (lvl.chapter && !seen.has(lvl.chapter)) {
      seen.add(lvl.chapter);
      starts.push({ chapter: lvl.chapter, oneBased: i + 1 });
    }
  });
  return starts;
})();

function chapterAt(oneBased: number): number {
  let cur = 1;
  for (const s of CHAPTER_STARTS) {
    if (oneBased >= s.oneBased) cur = s.chapter;
  }
  return cur;
}

export function MapScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const unlocks = useUnlocks();
  const furthest = unlocks.furthestLevel;
  const scrollRef = useRef<ScrollView>(null);

  // Re-pull unlock state when this screen comes back into focus, so the
  // map reflects the latest furthestLevel after the user just finished
  // a level and popped back to here.
  useFocusEffect(
    React.useCallback(() => {
      unlocks.refresh();
    }, [unlocks])
  );

  // Auto-scroll so the current level sits roughly 1/3 down the viewport.
  useEffect(() => {
    if (!unlocks.loaded) return;
    const screenH = Dimensions.get('window').height;
    const targetY = Math.max(
      0,
      (furthest - 1) * NODE_PITCH - screenH * 0.33
    );
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: targetY, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [unlocks.loaded, furthest]);

  const handlePick = async (oneBased: number) => {
    if (!user || oneBased > furthest) return;
    const idx = Math.max(0, Math.min(LEVELS.length - 1, oneBased - 1));
    const prev = await services.progress.load(user.userId);
    await services.progress.save({ ...prev, currentLevelIndex: idx });
    // navigate() pops back to the existing Game screen if one is on the
    // stack; useGameState now re-hydrates on focus so the picked level
    // takes effect even when reusing the old instance.
    navigation.navigate('Game');
  };

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
          <Text style={styles.title}>{t('map.title')}</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.path}>
            <View style={styles.pathLine} />
            {LEVELS.map((lvl, i) => {
              const oneBased = i + 1;
              const isCurrent = oneBased === furthest;
              const isPassed = oneBased < furthest;
              const isLocked = oneBased > furthest;
              const startsChapter = CHAPTER_STARTS.some(
                (s) => s.oneBased === oneBased
              );
              const chapter = chapterAt(oneBased);
              return (
                <React.Fragment key={lvl.id}>
                  {startsChapter ? (
                    <View style={styles.chapterHeader}>
                      <View style={styles.chapterRule} />
                      <Text style={styles.chapterHeaderText}>
                        {t('map.chapterHeader', { chapter })}
                      </Text>
                      <View style={styles.chapterRule} />
                    </View>
                  ) : null}
                  <Pressable
                    style={[
                      styles.node,
                      isCurrent && styles.nodeCurrent,
                      isPassed && styles.nodePassed,
                      isLocked && styles.nodeLocked,
                    ]}
                    onPress={() => handlePick(oneBased)}
                    disabled={isLocked}
                  >
                    <Text
                      style={[
                        styles.nodeLabel,
                        isCurrent && { color: '#0F172A' },
                      ]}
                    >
                      {oneBased}
                    </Text>
                    {isPassed ? (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    ) : null}
                    {isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>
                          {t('map.currentBadge')}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>
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
    paddingBottom: 12,
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
  scroll: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  path: {
    width: 220,
    alignItems: 'center',
    gap: 28,
    position: 'relative',
  },
  pathLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    zIndex: -1,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
    width: 260,
    alignSelf: 'center',
  },
  chapterRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  chapterHeaderText: {
    color: '#FACC15',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  node: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  nodeCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FACC15',
    transform: [{ scale: 1.1 }],
  },
  nodePassed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.30)',
  },
  nodeLocked: { opacity: 0.45 },
  nodeLabel: { fontSize: 22, fontWeight: '900', color: '#F8FAFC' },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34D399',
    borderWidth: 4,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  currentBadge: {
    position: 'absolute',
    bottom: -22,
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 1.5,
  },
});
