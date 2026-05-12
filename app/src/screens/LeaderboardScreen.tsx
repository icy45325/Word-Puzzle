import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { levelNumberOf } from '../utils/levelNumber';
import type {
  LeaderboardEntry,
  LeaderboardScope,
  ScoreRecord,
} from '../services/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

// Row height needs to match the actual rendered row + gap so the sticky
// detection logic can map scroll position to rank index.
const ROW_HEIGHT = 70;

export function LeaderboardScreen({ navigation }: Props) {
  useLocale();
  const services = useServices();
  const user = useCurrentUser();
  const unlocks = useUnlocks();
  const { theme } = useTheme();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [globalRows, setGlobalRows] = useState<LeaderboardEntry[]>([]);
  const [selfPbs, setSelfPbs] = useState<ScoreRecord[]>([]);
  const [selfSummary, setSelfSummary] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    if (scope === 'self') {
      Promise.all([
        services.leaderboard.listPersonalBests(user.userId),
        services.leaderboard.getTop('self', 1, user.userId),
      ]).then(([pbs, summary]) => {
        if (cancelled) return;
        setSelfPbs(pbs);
        setSelfSummary(summary[0] ?? null);
      });
    } else if (scope === 'global') {
      services.leaderboard.getTop('global', 100, user.userId).then((r) => {
        if (!cancelled) setGlobalRows(r);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [services, user, scope]);

  const tabs: { key: LeaderboardScope; label: string; locked?: boolean }[] = [
    { key: 'global', label: t('leaderboard.tabs.global') },
    { key: 'self', label: t('leaderboard.tabs.self') },
    {
      key: 'friends',
      label: t('leaderboard.tabs.friends'),
      locked: !unlocks.friendsLeaderboard,
    },
  ];

  // Compute the player's eligibility for the global rankings + a helpful
  // pinned "you're at" row when they haven't qualified yet. The
  // leaderboard service exposes its threshold so the UI stays in sync if
  // it ever changes.
  const eligibility = (services.leaderboard as any).getEligibilityInfo
    ? (services.leaderboard as any).getEligibilityInfo()
    : { thresholdLevel: 160, totalLevels: 200 };

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
          <Text style={styles.title}>{t('leaderboard.title')}</Text>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                scope === tab.key && [
                  styles.tabActive,
                  { backgroundColor: theme.primary, borderColor: theme.primary },
                ],
                tab.locked && styles.tabLocked,
              ]}
              onPress={() => setScope(tab.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  scope === tab.key && [
                    styles.tabLabelActive,
                    { color: theme.primaryText },
                  ],
                ]}
              >
                {tab.locked ? '🔒 ' : ''}
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {scope === 'friends' ? (
          <FriendsPlaceholder />
        ) : scope === 'global' ? (
          <GlobalList
            rows={globalRows}
            themePrimary={theme.primary}
            eligibility={eligibility}
            ownFurthest={unlocks.furthestLevel}
          />
        ) : (
          <SelfList
            summary={selfSummary}
            pbs={selfPbs}
            themePrimary={theme.primary}
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

function FriendsPlaceholder() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.empty}>{t('leaderboard.comingSoon')}</Text>
    </View>
  );
}

interface GlobalListProps {
  rows: LeaderboardEntry[];
  themePrimary: string;
  eligibility: { thresholdLevel: number; totalLevels: number };
  ownFurthest: number;
}

function GlobalList({
  rows,
  themePrimary,
  eligibility,
  ownFurthest,
}: GlobalListProps) {
  // Sticky self-row state. We track viewport scroll position and
  // compare against where the user's row actually sits in the list.
  // - self below viewport → render a sticky row pinned to the bottom
  // - self above viewport → sticky pinned to the top
  // - self inside viewport → no sticky (the actual row is already on screen)
  const [scrollY, setScrollY] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const listRef = useRef<FlatList<LeaderboardEntry>>(null);

  const selfIndex = useMemo(
    () => rows.findIndex((r) => r.isSelf),
    [rows]
  );
  const selfRow = selfIndex >= 0 ? rows[selfIndex] : null;

  // Self's projected y in scroll content. Each row is approximately
  // ROW_HEIGHT tall (matches styles.row); this is an estimate that's
  // accurate enough for the show-sticky decision.
  const selfY = selfIndex >= 0 ? selfIndex * ROW_HEIGHT : -1;
  const inViewport =
    selfY >= 0 &&
    viewportH > 0 &&
    selfY >= scrollY - ROW_HEIGHT &&
    selfY <= scrollY + viewportH - ROW_HEIGHT;
  const showStickyTop = selfRow != null && !inViewport && selfY < scrollY;
  const showStickyBottom =
    selfRow != null && !inViewport && selfY > scrollY + viewportH;

  // Player hasn't cleared enough levels yet to appear in the rankings.
  // Pin an info card to the bottom explaining the gate.
  const showIneligibleHint =
    selfRow == null && ownFurthest < eligibility.thresholdLevel;

  if (rows.length === 0 && !showIneligibleHint) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>{t('leaderboard.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(r) => r.userId}
        contentContainerStyle={styles.list}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        renderItem={({ item }) => (
          <GlobalRow item={item} themePrimary={themePrimary} />
        )}
      />

      {showStickyTop && selfRow ? (
        <View style={[styles.stickyWrap, styles.stickyTop]}>
          <GlobalRow item={selfRow} themePrimary={themePrimary} />
        </View>
      ) : null}

      {showStickyBottom && selfRow ? (
        <View style={[styles.stickyWrap, styles.stickyBottom]}>
          <GlobalRow item={selfRow} themePrimary={themePrimary} />
        </View>
      ) : null}

      {showIneligibleHint ? (
        <View style={[styles.stickyWrap, styles.stickyBottom]}>
          <View
            style={[styles.ineligibleCard, { borderColor: themePrimary }]}
          >
            <Text style={styles.ineligibleTitle}>
              {t(
                'leaderboard.eligibilityTitle',
                undefined,
                '通关 80% 解锁上榜资格'
              )}
            </Text>
            <Text style={styles.ineligibleSub}>
              {t(
                'leaderboard.eligibilityHint',
                { level: eligibility.thresholdLevel, current: ownFurthest },
                `当前 L${ownFurthest} / 上榜需 L${eligibility.thresholdLevel}`
              )}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function GlobalRow({
  item,
  themePrimary,
}: {
  item: LeaderboardEntry;
  themePrimary: string;
}) {
  const medal =
    item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : null;
  return (
    <View
      style={[
        styles.row,
        item.isSelf && {
          backgroundColor: `${themePrimary}33`,
          borderColor: themePrimary,
        },
      ]}
    >
      <Text style={styles.rank}>{medal ? medal : `#${item.rank}`}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>
          {item.isSelf
            ? t('leaderboard.global.you', undefined, '你')
            : item.displayName}
        </Text>
        <Text style={styles.subText}>
          {t(
            'leaderboard.furthestLevel',
            { level: item.furthestLevel },
            `L${item.furthestLevel}`
          )}
        </Text>
      </View>
      <Text style={styles.score}>💰 {item.coins.toLocaleString()}</Text>
    </View>
  );
}

function SelfList({
  summary,
  pbs,
  themePrimary,
}: {
  summary: LeaderboardEntry | null;
  pbs: ScoreRecord[];
  themePrimary: string;
}) {
  if (!summary) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>{t('leaderboard.empty')}</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={pbs}
      keyExtractor={(r) => r.levelId}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={[styles.summaryCard, { borderColor: themePrimary }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>
              {t('leaderboard.coinsLabel', undefined, '金币')}
            </Text>
            <Text style={[styles.summaryValue, { color: themePrimary }]}>
              💰 {summary.coins.toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>
              {t('leaderboard.clearedLabel', undefined, '已通关')}
            </Text>
            <Text style={styles.summaryValue}>{pbs.length}</Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {t('leaderboard.noPbsYet', undefined, '通关第一关后这里会列出每关战绩')}
        </Text>
      }
      renderItem={({ item }) => {
        const n = levelNumberOf(item.levelId);
        return (
          <View style={styles.row}>
            <Text style={styles.rank}>L{n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.subText}>
                {t(
                  'leaderboard.selfRowSub',
                  {
                    words: item.wordsFound,
                    totalWords: item.totalWords,
                    seconds: Math.round(item.timeMs / 1000),
                  },
                  `${item.wordsFound}/${item.totalWords} 词 · ${Math.round(item.timeMs / 1000)}秒`
                )}
              </Text>
            </View>
            <Text style={styles.score}>{item.score.toLocaleString()}</Text>
          </View>
        );
      }}
    />
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabActive: {},
  tabLocked: { opacity: 0.55 },
  tabLabel: { fontSize: 13, fontWeight: '800', color: '#F8FAFC' },
  tabLabelActive: { fontWeight: '900' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 100, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  rank: {
    width: 40,
    fontSize: 15,
    fontWeight: '900',
    color: '#FACC15',
    textAlign: 'left',
  },
  name: { fontSize: 14, fontWeight: '900', color: '#F8FAFC' },
  subText: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
  },
  score: { fontSize: 16, fontWeight: '900', color: '#FACC15' },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  // Sticky overlay containers — absolutely positioned over the FlatList,
  // anchored to top/bottom of the viewport.
  stickyWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  stickyTop: { top: 8 },
  stickyBottom: { bottom: 20 },
  // "Not yet eligible" card pinned at the bottom when player is below
  // the threshold.
  ineligibleCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  ineligibleTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  ineligibleSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
});
