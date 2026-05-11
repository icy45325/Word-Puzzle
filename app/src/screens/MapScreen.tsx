import React, { useEffect, useMemo, useRef } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { useCurrentUser, useServices } from '../services';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import levelsJson from '../data/levels.json';
import type { LevelDef } from '../utils/gridLayout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const LEVELS = (levelsJson as {
  levels: (LevelDef & { chapter?: number; difficulty?: number })[];
}).levels;

// ── Layout constants ─────────────────────────────────────────────────────
const NODE_SIZE = 60;
const NODE_PITCH = 110; // vertical distance between consecutive level centers
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_WIDTH = Math.min(SCREEN_WIDTH - 40, 320);
const CENTER_X = MAP_WIDTH / 2;
const WAVE_AMPLITUDE = MAP_WIDTH * 0.28; // how far nodes swing left/right
const WAVE_FREQ = 0.8;
const TOP_PADDING = 60;
const BOTTOM_PADDING = 80;
const TOTAL_HEIGHT =
  LEVELS.length * NODE_PITCH + TOP_PADDING + BOTTOM_PADDING;

/** y-coordinate (in content space, 0 = top of scrollable content) for the
 *  given 1-based level. Levels grow upward: level 1 sits at the bottom,
 *  level N at the top. */
function yForLevel(oneBased: number): number {
  return TOTAL_HEIGHT - BOTTOM_PADDING - (oneBased - 1) * NODE_PITCH;
}

/** x-coordinate for a level, swinging left/right via sin(). */
function xForLevel(oneBased: number): number {
  return CENTER_X + Math.sin(oneBased * WAVE_FREQ) * WAVE_AMPLITUDE;
}

/** SVG path "M ... L ..." between [fromLevel, toLevel] inclusive. */
function pathBetween(fromLevel: number, toLevel: number): string {
  if (toLevel < fromLevel) return '';
  let d = `M ${xForLevel(fromLevel).toFixed(1)} ${yForLevel(fromLevel).toFixed(1)}`;
  for (let i = fromLevel + 1; i <= toLevel; i++) {
    d += ` L ${xForLevel(i).toFixed(1)} ${yForLevel(i).toFixed(1)}`;
  }
  return d;
}

export function MapScreen({ navigation }: Props) {
  useLocale();
  const services = useServices();
  const user = useCurrentUser();
  const unlocks = useUnlocks();
  const { theme } = useTheme();
  const furthest = unlocks.furthestLevel;
  const scrollRef = useRef<ScrollView>(null);

  // Refresh unlock state on focus so finishing a level and popping back
  // here shows the updated current level.
  useFocusEffect(
    React.useCallback(() => {
      unlocks.refresh();
    }, [unlocks])
  );

  // Auto-scroll so the current level sits roughly mid-viewport.
  useEffect(() => {
    if (!unlocks.loaded) return;
    const viewportH = Dimensions.get('window').height;
    const y = yForLevel(furthest) - viewportH * 0.5;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false });
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

  const playCurrent = () => handlePick(furthest);

  // Build the two paths: the full dashed track and the lit-up progress.
  const fullPathD = useMemo(() => pathBetween(1, LEVELS.length), []);
  const progressPathD = useMemo(
    () => pathBetween(1, furthest),
    [furthest]
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />

        {/* Compact header row: back arrow + progress pill */}
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.progressPill}>
            <View
              style={[
                styles.progressBadge,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.progressBadgeIcon, { color: theme.primaryText }]}>
                🏆
              </Text>
            </View>
            <View>
              <Text style={styles.progressLabel}>
                {t('map.progressLabel', undefined, 'PROGRESS')}
              </Text>
              <Text style={styles.progressValue}>Lv. {furthest}</Text>
            </View>
          </View>
        </View>

        {/* Scrollable wavy map */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.mapInner,
              { width: MAP_WIDTH, height: TOTAL_HEIGHT },
            ]}
          >
            {/* Background dashed track + progress overlay */}
            <Svg
              width={MAP_WIDTH}
              height={TOTAL_HEIGHT}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Path
                d={fullPathD}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="10 10"
                fill="none"
              />
              <Path
                d={progressPathD}
                stroke={theme.primary}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>

            {LEVELS.map((lvl, i) => {
              const num = i + 1;
              const isCurrent = num === furthest;
              const isPassed = num < furthest;
              const isLocked = num > furthest;
              const x = xForLevel(num);
              const y = yForLevel(num);
              const stars = lvl.difficulty ?? 0;
              return (
                <View
                  key={lvl.id}
                  style={[
                    styles.nodeWrap,
                    {
                      left: x - NODE_SIZE / 2,
                      top: y - NODE_SIZE / 2,
                    },
                  ]}
                >
                  {/* Active-node halo */}
                  {isCurrent ? (
                    <View
                      style={[
                        styles.halo,
                        {
                          backgroundColor: `${theme.primary}33`,
                        },
                      ]}
                    />
                  ) : null}

                  <Pressable
                    onPress={() => handlePick(num)}
                    disabled={isLocked}
                    style={[
                      styles.node,
                      isPassed && styles.nodePassed,
                      isCurrent && [
                        styles.nodeCurrent,
                        {
                          backgroundColor: '#0F172A',
                          borderColor: theme.primary,
                        },
                      ],
                      isLocked && styles.nodeLocked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.nodeLabel,
                        isCurrent && styles.nodeLabelCurrent,
                        isLocked && styles.nodeLabelLocked,
                      ]}
                    >
                      {isLocked ? '🔒' : num}
                    </Text>
                  </Pressable>

                  {/* Current-level bubble */}
                  {isCurrent ? (
                    <View
                      style={[
                        styles.currentBubble,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currentBubbleText,
                          { color: theme.primaryText },
                        ]}
                      >
                        {t('map.currentBadge')}
                      </Text>
                    </View>
                  ) : null}

                  {/* Star rating for completed levels */}
                  {isPassed && stars > 0 ? (
                    <View style={styles.stars}>
                      {Array.from({ length: 3 }).map((_, s) => (
                        <Text
                          key={s}
                          style={[
                            styles.star,
                            s < stars && { color: theme.primary },
                          ]}
                        >
                          ★
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating PLAY NOW button */}
        <View style={styles.bottomFade} pointerEvents="box-none">
          <Pressable
            style={[styles.playBtn, { backgroundColor: theme.primary }]}
            onPress={playCurrent}
          >
            <Text style={[styles.playText, { color: theme.primaryText }]}>
              ▶  {t('map.playNow', undefined, '继续闯关')} · Lv. {furthest}
            </Text>
          </Pressable>
        </View>
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
    paddingTop: 4,
    paddingBottom: 10,
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
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 10,
  },
  progressBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeIcon: { fontSize: 16 },
  progressLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: -1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 120,
  },
  mapInner: {
    position: 'relative',
    alignSelf: 'center',
  },
  nodeWrap: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: NODE_SIZE + 28,
    height: NODE_SIZE + 28,
    borderRadius: (NODE_SIZE + 28) / 2,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.95)',
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  nodePassed: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  nodeCurrent: {
    transform: [{ scale: 1.18 }, { translateY: -4 }],
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  nodeLocked: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.10)',
    shadowOpacity: 0,
    elevation: 0,
  },
  nodeLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  nodeLabelCurrent: { color: '#FFFFFF' },
  nodeLabelLocked: { fontSize: 18, color: 'rgba(255,255,255,0.45)' },
  currentBubble: {
    position: 'absolute',
    bottom: -28,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  currentBubbleText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  stars: {
    position: 'absolute',
    bottom: -16,
    flexDirection: 'row',
    gap: 1,
  },
  star: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '900',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  playBtn: {
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  playText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});
