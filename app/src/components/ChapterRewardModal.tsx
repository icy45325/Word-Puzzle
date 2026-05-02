import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  chapter: number;
  coins: number;
  hints: number;
  hintCapped: boolean;
  onClaim: () => void;
}

export function ChapterRewardModal({
  visible,
  chapter,
  coins,
  hints,
  hintCapped,
  onClaim,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('chapterReward.title', { chapter })}</Text>

          <View style={styles.rewards}>
            <RewardRow icon="🪙" label={t('chapterReward.coins', { coins })} />
            {hints > 0 ? (
              <RewardRow icon="💡" label={t('chapterReward.hints', { hints })} />
            ) : null}
          </View>

          {hintCapped ? (
            <Text style={styles.cap}>{t('chapterReward.cap')}</Text>
          ) : null}

          <Pressable style={styles.btn} onPress={onClaim}>
            <Text style={styles.btnText}>{t('chapterReward.next')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function RewardRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.rewardRow}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.rewardText}>{label}</Text>
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
  rewards: { marginTop: 20, marginBottom: 16, gap: 8, alignSelf: 'stretch' },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2A3F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  icon: { fontSize: 22 },
  rewardText: { fontSize: 16, fontWeight: '700', color: '#F7C948' },
  cap: { fontSize: 12, color: '#3B5C75', marginBottom: 8, textAlign: 'center' },
  btn: {
    alignSelf: 'stretch',
    backgroundColor: '#0F2A3F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#F7C948', fontSize: 16, fontWeight: '700' },
});
