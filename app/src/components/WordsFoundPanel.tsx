import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  foundAnswers: string[];
  bonusWords: string[];
  onClose: () => void;
  onTapWord: (word: string, isBonus: boolean) => void;
}

export function WordsFoundPanel({
  visible,
  foundAnswers,
  bonusWords,
  onClose,
  onTapWord,
}: Props) {
  const isEmpty = foundAnswers.length === 0 && bonusWords.length === 0;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('wordsFound.title')} ({foundAnswers.length + bonusWords.length})
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
        {isEmpty ? (
          <Text style={styles.empty}>{t('wordsFound.empty')}</Text>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {foundAnswers.map((w) => (
              <Pressable
                key={`a-${w}`}
                style={styles.row}
                onPress={() => onTapWord(w, false)}
              >
                <Text style={styles.word}>{w}</Text>
              </Pressable>
            ))}
            {bonusWords.map((w) => (
              <Pressable
                key={`b-${w}`}
                style={[styles.row, styles.bonusRow]}
                onPress={() => onTapWord(w, true)}
              >
                <Text style={styles.word}>{w}</Text>
                <Text style={styles.bonusTag}>{t('wordsFound.bonus')}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#0F2A3F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 14,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomColor: '#1C3D57',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 16,
    color: '#F7F9FC',
    fontWeight: '700',
  },
  close: {
    fontSize: 24,
    color: '#9AB8CF',
    paddingHorizontal: 8,
  },
  empty: {
    color: '#9AB8CF',
    textAlign: 'center',
    paddingVertical: 32,
  },
  list: { marginTop: 4 },
  listContent: { paddingVertical: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomColor: '#1C3D57',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bonusRow: {},
  word: {
    fontSize: 18,
    color: '#F7F9FC',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  bonusTag: {
    fontSize: 11,
    color: '#F7C948',
    backgroundColor: 'rgba(247, 201, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
