import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  visible: boolean;
  levelId: string;
  wordsFound: number;
  totalWords: number;
  bonusCount: number;
  onNext: () => void;
}

export function LevelCompleteModal({
  visible,
  levelId,
  wordsFound,
  totalWords,
  bonusCount,
  onNext,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🎉 关卡完成 Level Complete</Text>
          <Text style={styles.subtitle}>{levelId}</Text>
          <View style={styles.statsRow}>
            <Stat label="答案" value={`${wordsFound}/${totalWords}`} />
            <Stat label="额外" value={`${bonusCount}`} />
          </View>
          <Pressable style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextText}>下一关 Next</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    maxWidth: 380,
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F2A3F' },
  subtitle: { marginTop: 4, fontSize: 14, color: '#3B5C75' },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    gap: 24,
  },
  stat: { alignItems: 'center', paddingHorizontal: 16 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0F2A3F' },
  statLabel: { marginTop: 4, fontSize: 12, color: '#3B5C75' },
  nextBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#0F2A3F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextText: { color: '#F7C948', fontSize: 16, fontWeight: '700' },
});
