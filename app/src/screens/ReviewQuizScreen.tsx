import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useCurrentUser, useServices } from '../services';
import { useTheme } from '../theme/ThemeProvider';
import { lookup } from '../utils/wordValidation';
import { speak } from '../utils/speech';
import { t } from '../i18n';
import type { LearnedWord } from '../services/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewQuiz'>;

interface QuizQuestion {
  word: string;
  meaning: string;
  options: string[]; // 4 words, one of which equals `word`
}

const MAX_QUESTIONS = 5;
const COIN_REWARD_PER_CORRECT = 5;

export function ReviewQuizScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { theme } = useTheme();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  // Build the quiz once on mount.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const due = await services.learnedWords.getDue(user.userId);
      const all = await services.learnedWords.list(user.userId);
      if (cancelled) return;
      setQuestions(buildQuestions(due, all));
    })();
    return () => {
      cancelled = true;
    };
  }, [services, user]);

  const current = questions?.[idx];
  const totalQuestions = questions?.length ?? 0;

  const handlePick = async (option: string) => {
    if (!user || picked || !current) return;
    setPicked(option);
    const correct = option === current.word;
    if (correct) setCorrectCount((c) => c + 1);
    speak(current.word);
    await services.learnedWords.applyReviewResult(user.userId, current.word, correct);
    services.analytics.track({
      name: 'word_found',
      props: { word: current.word, levelId: 'review_quiz', bonus: false },
    });
    setTimeout(() => {
      if (idx + 1 >= (questions?.length ?? 0)) {
        finish(correct ? correctCount + 1 : correctCount);
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 1100);
  };

  const finish = async (finalCorrect: number) => {
    if (!user) return;
    const earned = finalCorrect * COIN_REWARD_PER_CORRECT;
    if (earned > 0) {
      await services.economy.grantChapterReward(user.userId, {
        chapter: 0,
        coins: earned,
        hints: 0,
      });
    }
    setDone(true);
  };

  if (!user || questions === null) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <TopBar />
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{t('review.title')}</Text>
          </View>
          <View style={styles.centerWrap}>
            <Text style={styles.empty}>{t('review.loading')}</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (questions.length === 0) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <TopBar />
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{t('review.title')}</Text>
          </View>
          <View style={styles.centerWrap}>
            <Text style={styles.bigEmoji}>📚</Text>
            <Text style={styles.empty}>{t('review.noneYet')}</Text>
            <Text style={styles.emptyHint}>{t('review.noneYetHint')}</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (done) {
    const earned = correctCount * COIN_REWARD_PER_CORRECT;
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <TopBar />
          <View style={styles.summaryWrap}>
            <Text style={styles.summaryEmoji}>🎯</Text>
            <Text style={styles.summaryTitle}>{t('review.summaryTitle')}</Text>
            <Text style={styles.summaryScore}>
              {correctCount} / {totalQuestions}
            </Text>
            <Text style={styles.summarySub}>
              {t('review.summaryReward', { coins: earned })}
            </Text>
            <Pressable
              style={[styles.cta, { backgroundColor: theme.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.ctaText, { color: theme.primaryText }]}>
                {t('review.summaryDone')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const correctOption = current!.word;
  const showResult = picked !== null;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>{t('review.progressLabel')}</Text>
            <Text style={styles.headerTitle}>
              {idx + 1} / {totalQuestions}
            </Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <LinearGradient
          colors={theme.gradient as unknown as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promptCard}
        >
          <Text style={styles.promptHint}>{t('review.promptHint')}</Text>
          <Text style={styles.promptMeaning}>{current!.meaning}</Text>
        </LinearGradient>

        <View style={styles.options}>
          {current!.options.map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = opt === correctOption;
            const showAsRight = showResult && isCorrect;
            const showAsWrong = showResult && isPicked && !isCorrect;
            return (
              <Pressable
                key={opt}
                style={[
                  styles.optionBtn,
                  showAsRight && styles.optionRight,
                  showAsWrong && styles.optionWrong,
                  isPicked && !showAsRight && !showAsWrong && styles.optionPicked,
                ]}
                onPress={() => handlePick(opt)}
                disabled={showResult}
              >
                <Text
                  style={[
                    styles.optionText,
                    (showAsRight || showAsWrong) && styles.optionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showResult ? (
          <Text style={styles.feedback}>
            {picked === correctOption
              ? t('review.feedbackCorrect')
              : t('review.feedbackWrong', { word: correctOption })}
          </Text>
        ) : null}
      </SafeAreaView>
    </GradientBackground>
  );
}

function buildQuestions(due: LearnedWord[], all: LearnedWord[]): QuizQuestion[] {
  const pool = due.length > 0 ? due : all;
  const sample = pool.slice(0, MAX_QUESTIONS);
  const distractorPool = all
    .map((e) => e.word)
    .filter((w, i, arr) => arr.indexOf(w) === i);
  return sample
    .map((entry) => {
      const meta = lookup(entry.word);
      if (!meta) return null;
      const distractors = pickDistractors(entry.word, distractorPool, 3);
      const options = shuffle([entry.word, ...distractors]);
      return {
        word: entry.word,
        meaning: meta.meaning,
        options,
      };
    })
    .filter((q): q is QuizQuestion => q !== null);
}

function pickDistractors(target: string, pool: string[], n: number): string[] {
  const filtered = pool.filter((w) => w !== target);
  const shuffled = shuffle(filtered);
  // Prefer words within ±2 letters of the target so the choice doesn't
  // give it away by length alone.
  const sameLength = shuffled.filter(
    (w) => Math.abs(w.length - target.length) <= 2
  );
  const chosen = sameLength.slice(0, n);
  if (chosen.length < n) {
    for (const w of shuffled) {
      if (chosen.length >= n) break;
      if (!chosen.includes(w)) chosen.push(w);
    }
  }
  // Pad with placeholder if dictionary is too small (extremely rare).
  while (chosen.length < n) chosen.push(`???${chosen.length}`);
  return chosen;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  title: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.5 },
  promptCard: {
    margin: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  promptHint: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  promptMeaning: {
    marginTop: 14,
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  options: {
    paddingHorizontal: 20,
    gap: 12,
  },
  optionBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 18,
  },
  optionPicked: {
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  optionRight: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },
  optionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#F8FAFC',
    textAlign: 'center',
  },
  optionTextActive: { color: '#FFFFFF' },
  feedback: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  bigEmoji: { fontSize: 54 },
  empty: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  summaryWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  summaryEmoji: { fontSize: 64 },
  summaryTitle: { fontSize: 24, fontWeight: '900', color: '#F8FAFC' },
  summaryScore: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FACC15',
    letterSpacing: -2,
  },
  summarySub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginBottom: 12,
  },
  cta: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '900' },
});
