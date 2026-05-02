import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoinHud } from '../components/CoinHud';
import { CrosswordGrid } from '../components/CrosswordGrid';
import { HintButton } from '../components/HintButton';
import { LetterWheel } from '../components/LetterWheel';
import { LevelCompleteModal } from '../components/LevelCompleteModal';
import { WordDetailModal } from '../components/WordDetailModal';
import { WordPreview } from '../components/WordPreview';
import { WordsFoundPanel } from '../components/WordsFoundPanel';
import { useGameState } from '../hooks/useGameState';
import { useServices } from '../services';
import { t } from '../i18n';

export function GameScreen() {
  const services = useServices();
  const {
    level,
    layout,
    foundAnswers,
    bonusWords,
    totalAnswers,
    levelCompleted,
    isLastLevel,
    revealedCells,
    submitWord,
    revealLetter,
    nextLevel,
  } = useGameState();

  const failsBeforeAutoOpen = services.remoteConfig.getNumber(
    'wordDetail.failsBeforeAutoOpen',
    3
  );

  const [preview, setPreview] = useState('');
  const [detail, setDetail] = useState<{ word: string; isBonus: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const showToast = useCallback((msg: string, ms = 1200) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), ms);
  }, []);

  const handleSubmit = useCallback(
    (raw: string) => {
      const outcome = submitWord(raw);
      if (outcome.kind === 'answer') {
        if (outcome.failedCountForThisWord >= failsBeforeAutoOpen) {
          setDetail({ word: outcome.word, isBonus: false });
        } else {
          const coins =
            services.remoteConfig.getNumber('reward.wordBase', 5) +
            services.remoteConfig.getNumber('reward.wordPerLetter', 2) *
              outcome.word.length;
          showToast(t('game.toast.coinReward', { coins }));
        }
      } else if (outcome.kind === 'bonus') {
        const coins =
          services.remoteConfig.getNumber('reward.wordBase', 5) +
          services.remoteConfig.getNumber('reward.wordPerLetter', 2) *
            outcome.word.length;
        showToast(t('game.toast.coinReward', { coins }));
      } else if (outcome.kind === 'already_in_level' || outcome.kind === 'duplicate') {
        showToast(t('game.toast.duplicate'), 800);
      } else if (outcome.kind === 'not_a_word' && raw.length >= 2) {
        showToast(t('game.toast.notWord'), 800);
      }
    },
    [submitWord, failsBeforeAutoOpen, services.remoteConfig, showToast]
  );

  const handleHintInsufficient = useCallback(() => {
    showToast(t('hint.insufficient'));
  }, [showToast]);

  return (
    <SafeAreaView style={styles.safe}>
      <CoinHud />

      <View style={styles.header}>
        <Text style={styles.levelLabel}>{level.id}</Text>
        <Text style={styles.progress}>
          {t('game.foundLabel')} {foundAnswers.length}/{totalAnswers}
          {bonusWords.length > 0 ? `   ·   ${t('game.bonusLabel')} ${bonusWords.length}` : ''}
        </Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.foundBtn}
            onPress={() => setPanelOpen(true)}
          >
            <Text style={styles.foundBtnText}>
              {t('game.wordsFound', { count: foundAnswers.length + bonusWords.length })}
            </Text>
          </Pressable>
          <HintButton onReveal={revealLetter} onInsufficient={handleHintInsufficient} />
        </View>
      </View>

      <CrosswordGrid
        layout={layout}
        foundWords={foundAnswers}
        revealedCells={revealedCells}
      />

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
        visible={levelCompleted && !detail && !panelOpen}
        levelId={level.id}
        wordsFound={foundAnswers.length}
        totalWords={totalAnswers}
        bonusCount={bonusWords.length}
        onNext={isLastLevel ? () => undefined : nextLevel}
        nextDisabled={isLastLevel}
        nextDisabledLabel={t('game.lastLevel')}
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
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  foundBtn: {
    backgroundColor: '#1C3D57',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  foundBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F7F9FC',
  },
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
});
