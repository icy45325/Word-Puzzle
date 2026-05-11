import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  /** The words the player spelled in to fill the level's slots. With the
   *  multi-acceptable-words rules in place we don't track "bonus" anymore;
   *  this panel just lists what was filled. */
  foundAnswers: string[];
  onClose: () => void;
  onTapWord: (word: string) => void;
}

export function WordsFoundPanel({
  visible,
  foundAnswers,
  onClose,
  onTapWord,
}: Props) {
  const isEmpty = foundAnswers.length === 0;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('wordsFound.title')} ({foundAnswers.length})
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
                onPress={() => onTapWord(w)}
              >
                <Text style={styles.word}>{w}</Text>
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
  word: {
    fontSize: 18,
    color: '#F7F9FC',
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
