import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChapterRewardModal } from '../components/ChapterRewardModal';
import { CrosswordGrid } from '../components/CrosswordGrid';
import { GradientBackground } from '../components/GradientBackground';
import { HintButton } from '../components/HintButton';
import { LetterWheel } from '../components/LetterWheel';
import { LevelCompleteModal } from '../components/LevelCompleteModal';
import { TopBar } from '../components/TopBar';
import { WordDetailModal } from '../components/WordDetailModal';
import { WordPreview } from '../components/WordPreview';
import { WordsFoundPanel } from '../components/WordsFoundPanel';
import { useEconomy } from '../hooks/useEconomy';
import { useGameState } from '../hooks/useGameState';
import { useCurrentUser, useServices } from '../services';
import { t } from '../i18n';
import { pickPraise, type PraiseKeys } from '../utils/praise';
import { levelNumberOf } from '../utils/levelNumber';
import levelsJson from '../data/levels.json';
import type { LevelDef } from '../utils/gridLayout';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const ALL_LEVELS = (levelsJson as { levels: (LevelDef & { chapter?: number })[] })
  .levels;

export function GameScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { state: economyState } = useEconomy();
  const {
    level,
    layout,
    foundAnswers,
    bonusWords,
    totalAnswers,
    levelCompleted,
    isChapterEnd,
    chapterIndex,
    isLastLevel,
    revealedCells,
    submitWord,
    revealLetter,
    nextLevel,
    claimChapterReward,
  } = useGameState();
  const [chapterWords, setChapterWords] = useState<string[]>([]);
  const [praise, setPraise] = useState<PraiseKeys | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const wrongAttemptsRef = useRef<number>(0);
  const hintsUsedRef = useRef<number>(0);

  // Reset perf counters whenever a new level is hydrated.
  useEffect(() => {
    startedAtRef.current = Date.now();
    wrongAttemptsRef.current = 0;
    hintsUsedRef.current = 0;
    setPraise(null);
  }, [level.id]);

  // When the level just completed, compute the praise tier once.
  useEffect(() => {
    if (!levelCompleted) {
      setPraise(null);
      return;
    }
    setPraise(
      pickPraise({
        timeMs: Date.now() - startedAtRef.current,
        hintsUsed: hintsUsedRef.current,
        wrongAttempts: wrongAttemptsRef.current,
      })
    );
  }, [levelCompleted]);

  // When the chapter just ended, gather every word the player learned in
  // this chapter across all 10 levels (target + bonus) so we can show
  // them as chips on the reward modal.
  useEffect(() => {
    if (!isChapterEnd || !user) return;
    let cancelled = false;
    (async () => {
      const progress = await services.progress.load(user.userId);
      const chapterLevelIds = ALL_LEVELS.filter((l) => l.chapter === chapterIndex).map(
        (l) => l.id
      );
      const words = new Set<string>();
      for (const id of chapterLevelIds) {
        for (const w of progress.foundWordsByLevel[id] ?? []) words.add(w);
      }
      for (const w of foundAnswers) words.add(w);
      for (const w of bonusWords) words.add(w);
      if (!cancelled) setChapterWords([...words].sort());
    })();
    return () => {
      cancelled = true;
    };
  }, [isChapterEnd, chapterIndex, services, user, foundAnswers, bonusWords]);

  const failsBeforeAutoOpen = services.remoteConfig.getNumber(
    'wordDetail.failsBeforeAutoOpen',
    3
  );

  const [preview, setPreview] = useState('');
  const [detail, setDetail] = useState<{ word: string; isBonus: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const hintCapLevel = services.remoteConfig.getNumber('chapter.hintCapLevel', 50);
  const chapterHintsGranted = services.remoteConfig.getNumber('chapter.hintsGranted', 3);
  const chapterCoinsReward = services.remoteConfig.getNumber('chapter.rewardCoins', 100);
  const levelNumber = levelNumberOf(level.id);
  const hintsForThisChapter =
    levelNumber <= hintCapLevel ? chapterHintsGranted : 0;
  const hintCapped = chapterHintsGranted > 0 && hintsForThisChapter === 0;

  const showToast = useCallback((msg: string, ms = 1200) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), ms);
  }, []);

  const handleSubmit = useCallback(
    (raw: string) => {
      const outcome = submitWord(raw);
      const coinsForWord = (len: number) =>
        services.remoteConfig.getNumber('reward.wordBase', 5) +
        services.remoteConfig.getNumber('reward.wordPerLetter', 2) * len;
      if (outcome.kind === 'answer') {
        if (outcome.failedCountForThisWord >= failsBeforeAutoOpen) {
          setDetail({ word: outcome.word, isBonus: false });
        } else {
          showToast(t('game.toast.coinReward', { coins: coinsForWord(outcome.word.length) }));
        }
      } else if (outcome.kind === 'bonus') {
        // #9: bonus words are no longer surfaced as "额外". Just show the
        // same coin reward toast as a target-word find. Internally still
        // tracked for learnedWords purposes.
        showToast(t('game.toast.coinReward', { coins: coinsForWord(outcome.word.length) }));
      } else if (outcome.kind === 'already_in_level' || outcome.kind === 'duplicate') {
        showToast(t('game.toast.duplicate'), 800);
      } else if (outcome.kind === 'not_a_word' && raw.length >= 2) {
        wrongAttemptsRef.current += 1;
        showToast(t('game.toast.notWord'), 800);
      }
    },
    [submitWord, failsBeforeAutoOpen, services.remoteConfig, showToast]
  );

  const handleReveal = useCallback(async () => {
    const result = await revealLetter();
    if (result.ok) hintsUsedRef.current += 1;
    return result;
  }, [revealLetter]);

  const headerTitle = useMemo(
    () => t('game.headerLevel', { level: levelNumber }),
    [levelNumber]
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />

        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>{t('game.headerLabel')}</Text>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
          </View>
          <HintButton onReveal={handleReveal} />
        </View>

        <View style={styles.gridWrap}>
          <CrosswordGrid
            layout={layout}
            foundWords={foundAnswers}
            revealedCells={revealedCells}
          />
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {t('game.foundLabel')} {foundAnswers.length}/{totalAnswers}
          </Text>
          <Pressable
            style={styles.foundBtn}
            onPress={() => setPanelOpen(true)}
          >
            <Text style={styles.foundBtnText}>
              {t('game.wordsFound', {
                count: foundAnswers.length + bonusWords.length,
              })}
            </Text>
          </Pressable>
        </View>

        <WordPreview
          word={preview || t('game.preview.placeholder')}
          active={preview.length > 0}
        />

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        <View style={styles.wheelWrap}>
          <LetterWheel
            letters={level.letters}
            onSubmit={handleSubmit}
            onPreview={setPreview}
          />
        </View>

        <WordsFoundPanel
          visible={panelOpen}
          foundAnswers={foundAnswers}
          bonusWords={bonusWords}
          onClose={() => setPanelOpen(false)}
          onTapWord={(word, isBonus) => {
            setPanelOpen(false);
            setDetail({ word, isBonus });
          }}
        />

        <WordDetailModal
          word={detail?.word ?? null}
          isBonus={detail?.isBonus}
          onClose={() => setDetail(null)}
        />

        <LevelCompleteModal
          visible={levelCompleted && !isChapterEnd && !detail && !panelOpen}
          levelLabel={headerTitle}
          praise={praise}
          wordsFound={foundAnswers.length}
          totalWords={totalAnswers}
          totalCoins={economyState?.coins}
          onNext={isLastLevel ? () => undefined : nextLevel}
          nextDisabled={isLastLevel}
          nextDisabledLabel={t('game.lastLevel')}
        />

        <ChapterRewardModal
          visible={levelCompleted && isChapterEnd && !detail && !panelOpen}
          chapter={chapterIndex}
          coins={chapterCoinsReward}
          hints={hintsForThisChapter}
          hintCapped={hintCapped}
          newWords={chapterWords}
          onClaim={async () => {
            await claimChapterReward();
            if (!isLastLevel) nextLevel();
          }}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
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
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  headerTitle: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  gridWrap: {
    marginTop: 16,
    paddingVertical: 18,
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  progressRow: {
    marginTop: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: { fontSize: 13, fontWeight: '700', color: '#F8FAFC' },
  foundBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  foundBtnText: { fontSize: 12, fontWeight: '700', color: '#F8FAFC' },
  toast: {
    alignSelf: 'center',
    backgroundColor: 'rgba(250,204,21,0.20)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 6,
  },
  toastText: { color: '#FACC15', fontSize: 12, fontWeight: '700' },
  wheelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
});
