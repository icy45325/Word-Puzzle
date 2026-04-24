import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useServices } from '../services';
import { lookup } from '../utils/wordValidation';
import { speak } from '../utils/speech';

interface Props {
  word: string | null;
  isBonus?: boolean;
  onClose: () => void;
}

export function WordDetailModal({ word, isBonus, onClose }: Props) {
  const services = useServices();
  const entry = word ? lookup(word) : null;

  useEffect(() => {
    if (!word) return;
    services.analytics.track({ name: 'word_detail_shown', props: { word } });
    speak(word);
  }, [services, word]);

  if (!word) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {isBonus ? (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>额外发现 · Bonus</Text>
            </View>
          ) : null}
          <View style={styles.headerRow}>
            <Text style={styles.word}>{word}</Text>
            <Pressable onPress={() => speak(word)} style={styles.speakerBtn} hitSlop={10}>
              <Text style={styles.speakerText}>🔊</Text>
            </Pressable>
          </View>
          {entry ? (
            <>
              <Text style={styles.phonetic}>{entry.phonetic}  {entry.pos}</Text>
              <Text style={styles.meaning}>{entry.meaning}</Text>
              <View style={styles.exampleBlock}>
                <Text style={styles.exampleEn}>{entry.example}</Text>
                <Text style={styles.exampleCn}>{entry.exampleCn}</Text>
              </View>
              {entry.extra ? <Text style={styles.extra}>💡 {entry.extra}</Text> : null}
            </>
          ) : (
            <Text style={styles.meaning}>（词库暂无扩展信息）</Text>
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>继续 Continue</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 20,
  },
  bonusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7C948',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2A3F',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  word: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F2A3F',
    letterSpacing: 2,
  },
  speakerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1C3D57',
  },
  speakerText: { fontSize: 18, color: '#F7F9FC' },
  phonetic: {
    marginTop: 4,
    fontSize: 16,
    color: '#3B5C75',
    fontStyle: 'italic',
  },
  meaning: {
    marginTop: 10,
    fontSize: 18,
    color: '#0F2A3F',
    fontWeight: '600',
  },
  exampleBlock: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#E8EEF4',
    borderRadius: 10,
  },
  exampleEn: {
    fontSize: 15,
    color: '#0F2A3F',
    fontWeight: '500',
  },
  exampleCn: {
    marginTop: 4,
    fontSize: 14,
    color: '#3B5C75',
  },
  extra: {
    marginTop: 12,
    fontSize: 13,
    color: '#3B5C75',
    lineHeight: 20,
  },
  closeBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
    backgroundColor: '#0F2A3F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#F7C948',
    fontSize: 16,
    fontWeight: '700',
  },
});
