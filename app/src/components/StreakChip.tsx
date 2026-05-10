import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../i18n';

interface Props {
  streakDays: number;
  alreadyClaimed: boolean;
  onPress?: () => void;
}

export function StreakChip({ streakDays, alreadyClaimed, onPress }: Props) {
  const Container: React.ElementType = onPress ? Pressable : View;
  return (
    <Container style={styles.chip} onPress={onPress}>
      <Text style={styles.flame}>🔥</Text>
      <Text style={styles.label}>
        {t('dailyCheckIn.streakChip', { days: streakDays })}
      </Text>
      {alreadyClaimed ? (
        <Text style={styles.dot}>· {t('dailyCheckIn.claimedToday')}</Text>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    borderColor: 'rgba(250, 204, 21, 0.40)',
    borderWidth: 1,
    borderRadius: 999,
    marginBottom: 10,
    gap: 4,
  },
  flame: { fontSize: 14 },
  label: { color: '#FACC15', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  dot: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '700' },
});
