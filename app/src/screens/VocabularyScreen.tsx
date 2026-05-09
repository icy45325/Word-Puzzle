import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentUser, useServices } from '../services';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { WordDetailModal } from '../components/WordDetailModal';
import { useTheme } from '../theme/ThemeProvider';
import { MAX_MASTERY } from '../utils/spacedRepetition';
import { t } from '../i18n';
import type { LearnedWord } from '../services/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Vocabulary'>;

type Bucket = 'due' | 'learning' | 'mastered';

export function VocabularyScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { theme } = useTheme();
  const [items, setItems] = useState<LearnedWord[]>([]);
  const [tab, setTab] = useState<Bucket>('due');
  const [detail, setDetail] = useState<{ word: string; isBonus: boolean } | null>(null);

  const refresh = React.useCallback(() => {
    if (!user) return;
    services.learnedWords.list(user.userId).then((list) => {
      const sorted = [...list].sort((a, b) => b.firstFoundAt - a.firstFoundAt);
      setItems(sorted);
    });
  }, [services, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-pull when returning from quiz / detail so mastery changes show.
  useFocusEffect(React.useCallback(() => {
    refresh();
  }, [refresh]));

  const buckets = useMemo(() => splitByMastery(items), [items]);
  const visible = buckets[tab];
  const dueCount = buckets.due.length;

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
          <Text style={styles.title}>{t('vocabulary.title')}</Text>
        </View>
        <Text style={styles.count}>
          {t('vocabulary.count', { count: items.length })}
        </Text>

        {dueCount > 0 ? (
          <Pressable
            style={[styles.reviewCta, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('ReviewQuiz')}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.reviewCtaTitle, { color: theme.primaryText }]}>
                {t('vocabulary.dueCta', { count: dueCount })}
              </Text>
              <Text style={[styles.reviewCtaSub, { color: theme.primaryText, opacity: 0.85 }]}>
                {t('vocabulary.dueCtaSub')}
              </Text>
            </View>
            <Text style={[styles.reviewCtaArrow, { color: theme.primaryText }]}>›</Text>
          </Pressable>
        ) : null}

        <View style={styles.tabs}>
          <TabBtn label={t('vocabulary.tabs.due', { count: buckets.due.length })} active={tab === 'due'} onPress={() => setTab('due')} />
          <TabBtn label={t('vocabulary.tabs.learning', { count: buckets.learning.length })} active={tab === 'learning'} onPress={() => setTab('learning')} />
          <TabBtn label={t('vocabulary.tabs.mastered', { count: buckets.mastered.length })} active={tab === 'mastered'} onPress={() => setTab('mastered')} />
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>
              {tab === 'due'
                ? t('vocabulary.emptyDue')
                : tab === 'mastered'
                ? t('vocabulary.emptyMastered')
                : t('vocabulary.empty')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(it) => it.word}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => setDetail({ word: item.word, isBonus: item.isBonus })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.word}>{item.word}</Text>
                  <MasteryBar level={item.masteryLevel ?? 0} />
                </View>
                {item.isBonus ? (
                  <Text style={styles.bonusTag}>{t('vocabulary.bonusTag')}</Text>
                ) : null}
                <Text style={styles.levelTag}>{item.levelId}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )}
          />
        )}

        <WordDetailModal
          word={detail?.word ?? null}
          isBonus={detail?.isBonus}
          onClose={() => {
            setDetail(null);
            refresh();
          }}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

interface TabProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabBtn({ label, active, onPress }: TabProps) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MasteryBar({ level }: { level: number }) {
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < MAX_MASTERY; i++) {
    dots.push(
      <View
        key={i}
        style={[
          styles.masteryDot,
          i < level ? styles.masteryDotFull : styles.masteryDotEmpty,
        ]}
      />
    );
  }
  return <View style={styles.masteryBar}>{dots}</View>;
}

function splitByMastery(items: LearnedWord[], now: number = Date.now()): {
  due: LearnedWord[];
  learning: LearnedWord[];
  mastered: LearnedWord[];
} {
  const due: LearnedWord[] = [];
  const learning: LearnedWord[] = [];
  const mastered: LearnedWord[] = [];
  for (const e of items) {
    const mastery = e.masteryLevel ?? 0;
    const dueAt = e.nextReviewDue ?? e.firstFoundAt;
    if (mastery >= MAX_MASTERY) {
      mastered.push(e);
    } else if (dueAt <= now) {
      due.push(e);
    } else {
      learning.push(e);
    }
  }
  return { due, learning, mastered };
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
  count: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  reviewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 12,
  },
  reviewCtaTitle: { fontSize: 15, fontWeight: '900' },
  reviewCtaSub: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  reviewCtaArrow: { fontSize: 28, fontWeight: '900' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  tabActive: { backgroundColor: '#FACC15', borderColor: '#FACC15' },
  tabLabel: { fontSize: 12, fontWeight: '800', color: '#F8FAFC' },
  tabLabelActive: { color: '#0F172A' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  word: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#F8FAFC',
  },
  bonusTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FACC15',
    backgroundColor: 'rgba(250,204,21,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    letterSpacing: 1,
  },
  levelTag: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  chevron: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 20,
  },
  masteryBar: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  masteryDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  masteryDotFull: { backgroundColor: '#22C55E' },
  masteryDotEmpty: { backgroundColor: 'rgba(255,255,255,0.18)' },
});
