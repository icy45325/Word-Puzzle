import React, { useEffect, useRef } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import levelsJson from '../data/levels.json';
import type { LevelDef } from '../utils/gridLayout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const LEVELS = (levelsJson as { levels: (LevelDef & { chapter?: number })[] }).levels;

// Vertical pitch between consecutive nodes (node height + gap from styles).
const NODE_PITCH = 84 + 28;

export function MapScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const unlocks = useUnlocks();
  const furthest = unlocks.furthestLevel;
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll so the current level sits roughly 1/3 down the viewport
  // once we know `furthest` (i.e. once unlocks have hydrated).
  useEffect(() => {
    if (!unlocks.loaded) return;
    const screenH = Dimensions.get('window').height;
    const targetY = Math.max(
      0,
      (furthest - 1) * NODE_PITCH - screenH * 0.33
    );
    // Defer one frame so the ScrollView has measured.
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
          <Text style={styles.title}>冒险地图</Text>
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
              return (
                <Pressable
                  key={lvl.id}
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
                      <Text style={styles.currentBadgeText}>挑战中</Text>
                    </View>
                  ) : null}
                  {lvl.chapter ? (
                    <Text style={styles.chapterTag}>第{lvl.chapter}章</Text>
                  ) : null}
                </Pressable>
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
  chapterTag: {
    position: 'absolute',
    right: -78,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
