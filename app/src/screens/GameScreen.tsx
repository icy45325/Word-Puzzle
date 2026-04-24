import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoinHud } from '../components/CoinHud';
import { CrosswordGrid } from '../components/CrosswordGrid';
import { LetterWheel } from '../components/LetterWheel';
import { LevelCompleteModal } from '../components/LevelCompleteModal';
import { WordDetailModal } from '../components/WordDetailModal';
import { WordPreview } from '../components/WordPreview';
import { useGameState } from '../hooks/useGameState';
import { t } from '../i18n';

export function GameScreen() {
  const {
    level,
    layout,
    foundAnswers,
    bonusWords,
    totalAnswers,
    levelCompleted,
    submitWord,
    nextLevel,
  } = useGameState();

  const [preview, setPreview] = useState('');
  const [detail, setDetail] = useState<{ word: string; isBonus: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (raw: string) => {
      const outcome = submitWord(raw);
      if (outcome.kind === 'answer' || outcome.kind === 'bonus') {
        setDetail({ word: outcome.word, isBonus: outcome.isBonus });
        setToast(null);
      } else if (outcome.kind === 'already_in_level' || outcome.kind === 'duplicate') {
        setToast('已经找过啦 Already found');
        setTimeout(() => setToast(null), 1000);
      } else if (outcome.kind === 'not_a_word' && raw.length >= 2) {
        setToast('不是有效单词 Not a word');
        setTimeout(() => setToast(null), 1000);
      }
    },
    [submitWord]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <CoinHud />

      <View style={styles.header}>
        <Text style={styles.levelLabel}>{level.id}</Text>
        <Text style={styles.progress}>
          {t('game.foundLabel')} {foundAnswers.length}/{totalAnswers}
          {bonusWords.length > 0 ? `   ·   ${t('game.bonusLabel')} ${bonusWords.length}` : ''}
        </Text>
      </View>

      <CrosswordGrid layout={layout} foundWords={foundAnswers} />

      <WordPreview word={preview || t('game.preview.placeholder')} />

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

      {bonusWords.length > 0 ? (
        <View style={styles.bonusBar}>
          {bonusWords.map((w) => (
            <Pressable
              key={w}
              style={styles.bonusPill}
              onPress={() => setDetail({ word: w, isBonus: true })}
            >
              <Text style={styles.bonusPillText}>{w}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <WordDetailModal
        word={detail?.word ?? null}
        isBonus={detail?.isBonus}
        onClose={() => setDetail(null)}
      />

      <LevelCompleteModal
        visible={levelCompleted && !detail}
        levelId={level.id}
        wordsFound={foundAnswers.length}
        totalWords={totalAnswers}
        bonusCount={bonusWords.length}
        onNext={nextLevel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
  },
  levelLabel: { fontSize: 14, color: '#9AB8CF', letterSpacing: 2 },
  progress: { marginTop: 4, fontSize: 14, color: '#F7F9FC', fontWeight: '600' },
  wheelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  toast: {
    alignSelf: 'center',
    backgroundColor: 'rgba(247, 201, 72, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginVertical: 4,
  },
  toastText: { color: '#F7C948', fontSize: 12, fontWeight: '600' },
  bonusBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  bonusPill: {
    backgroundColor: 'rgba(247, 201, 72, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bonusPillText: { fontSize: 12, fontWeight: '700', color: '#F7C948' },
});
