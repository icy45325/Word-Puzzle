import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { WordDetailModal } from '../components/WordDetailModal';
import { t } from '../i18n';
import type { LearnedWord } from '../services/types';

export function VocabularyScreen() {
  const services = useServices();
  const user = useCurrentUser();
  const [items, setItems] = useState<LearnedWord[]>([]);
  const [detail, setDetail] = useState<{ word: string; isBonus: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    services.learnedWords.list(user.userId).then((list) => {
      if (cancelled) return;
      const sorted = [...list].sort((a, b) => b.firstFoundAt - a.firstFoundAt);
      setItems(sorted);
    });
    return () => {
      cancelled = true;
    };
  }, [services, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.headerRow}>
        <Text style={styles.count}>
          {t('vocabulary.count', { count: items.length })}
        </Text>
      </View>
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>{t('vocabulary.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.word}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => setDetail({ word: item.word, isBonus: item.isBonus })}
            >
              <Text style={styles.word}>{item.word}</Text>
              {item.isBonus ? (
                <Text style={styles.bonusTag}>{t('vocabulary.bonusTag')}</Text>
              ) : null}
              <Text style={styles.levelTag}>{item.levelId}</Text>
            </Pressable>
          )}
        />
      )}
      <WordDetailModal
        word={detail?.word ?? null}
        isBonus={detail?.isBonus}
        onClose={() => setDetail(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  headerRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  count: { fontSize: 13, color: '#9AB8CF' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  empty: {
    fontSize: 14,
    color: '#9AB8CF',
    textAlign: 'center',
    lineHeight: 22,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3D57',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 12,
    marginBottom: 8,
  },
  word: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#F7F9FC',
  },
  bonusTag: {
    fontSize: 11,
    color: '#F7C948',
    backgroundColor: 'rgba(247, 201, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelTag: {
    fontSize: 12,
    color: '#9AB8CF',
  },
});
