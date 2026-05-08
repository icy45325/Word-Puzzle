import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { WordDetailModal } from '../components/WordDetailModal';
import { t } from '../i18n';
import type { LearnedWord } from '../services/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Vocabulary'>;

export function VocabularyScreen({ navigation }: Props) {
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
          <Text style={styles.title}>词库档案</Text>
        </View>
        <Text style={styles.count}>
          {t('vocabulary.count', { count: items.length })}
        </Text>

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
                <View style={{ flex: 1 }}>
                  <Text style={styles.word}>{item.word}</Text>
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
          onClose={() => setDetail(null)}
        />
      </SafeAreaView>
    </GradientBackground>
  );
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
});
