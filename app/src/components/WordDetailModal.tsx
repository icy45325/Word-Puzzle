import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCurrentUser, useServices } from '../services';
import { useTheme } from '../theme/ThemeProvider';
import { lookup } from '../utils/wordValidation';
import { speak } from '../utils/speech';
import { t } from '../i18n';

interface Props {
  word: string | null;
  isBonus?: boolean;
  /** When true, the mastery row (我记住了 / 还没记住) is hidden — useful
   *  inside the quiz screen where mastery is updated via quiz answers. */
  hideMastery?: boolean;
  onClose: () => void;
}

export function WordDetailModal({ word, isBonus, hideMastery, onClose }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { theme } = useTheme();
  const entry = word ? lookup(word) : null;
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!word) return;
    services.analytics.track({ name: 'word_detail_shown', props: { word } });
    speak(word);
    setFeedback(null);
  }, [services, word]);

  const handleMastery = useCallback(
    async (delta: 1 | -1) => {
      if (!word || !user) return;
      await services.learnedWords.setMastery(user.userId, word, delta);
      setFeedback(
        delta === 1
          ? t('wordDetail.markedRemembered')
          : t('wordDetail.markedReview')
      );
    },
    [services, user, word]
  );

  if (!word) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {isBonus ? (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusText}>BONUS</Text>
              </View>
            ) : null}
            <View style={styles.wordRow}>
              <Text style={styles.word}>{word}</Text>
              <Pressable
                onPress={() => speak(word)}
                style={styles.speakerBtn}
                hitSlop={10}
              >
                <Text style={styles.speakerText}>🔊</Text>
              </Pressable>
            </View>
            <Text style={styles.phonetic}>
              {entry?.phonetic ?? '/.../'}  {entry?.pos ?? ''}
            </Text>
          </LinearGradient>
          <View style={styles.body}>
            {entry ? (
              <>
                <Text style={styles.meaning}>{entry.meaning}</Text>
                <View style={styles.exampleBlock}>
                  <Text style={styles.exampleEn}>{`"${entry.example}"`}</Text>
                  <Text style={styles.exampleCn}>{entry.exampleCn}</Text>
                </View>
                {entry.extra ? (
                  <Text style={styles.extra}>💡 {entry.extra}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.meaning}>（词库暂无扩展信息）</Text>
            )}
            {!hideMastery ? (
              <View style={styles.masteryRow}>
                <Pressable
                  style={[styles.masteryBtn, styles.masteryBtnAgain]}
                  onPress={() => handleMastery(-1)}
                >
                  <Text style={styles.masteryBtnAgainText}>
                    {t('wordDetail.notYet')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.masteryBtn, styles.masteryBtnGot]}
                  onPress={() => handleMastery(1)}
                >
                  <Text style={styles.masteryBtnGotText}>
                    {t('wordDetail.remembered')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            <Pressable
              style={[styles.closeBtn, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.closeText, { color: theme.primaryText }]}>
                {t('wordDetail.continue')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
  },
  header: {
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  bonusBadge: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  bonusText: { fontSize: 11, fontWeight: '900', color: '#0F172A', letterSpacing: 2 },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  word: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#FFFFFF',
  },
  speakerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerText: { fontSize: 16 },
  phonetic: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  meaning: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '900',
  },
  exampleBlock: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exampleEn: {
    fontSize: 15,
    color: '#0F172A',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  exampleCn: {
    marginTop: 6,
    fontSize: 13,
    color: '#475569',
  },
  extra: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  closeBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  closeText: { fontSize: 17, fontWeight: '900' },
  masteryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  masteryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  masteryBtnAgain: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  masteryBtnAgainText: { fontSize: 13, fontWeight: '900', color: '#92400E' },
  masteryBtnGot: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  masteryBtnGotText: { fontSize: 13, fontWeight: '900', color: '#166534' },
  feedback: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
