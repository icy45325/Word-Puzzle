import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useEconomy } from '../hooks/useEconomy';
import type { RevealResult } from '../hooks/useGameState';
import { t } from '../i18n';

interface Props {
  onReveal: () => Promise<RevealResult>;
  onInsufficient: () => void;
}

export function HintButton({ onReveal, onInsufficient }: Props) {
  const { state } = useEconomy();
  const hints = state?.hints ?? 0;
  const disabled = hints <= 0;

  const handlePress = useCallback(async () => {
    if (disabled) {
      onInsufficient();
      return;
    }
    const result = await onReveal();
    if (!result.ok && result.reason === 'no_hints') onInsufficient();
  }, [disabled, onReveal, onInsufficient]);

  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={handlePress}
    >
      <Text style={styles.icon}>{t('hint.button')}</Text>
      <Text style={styles.count}>{hints}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7C948',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  disabled: {
    backgroundColor: '#3A5670',
    opacity: 0.65,
  },
  icon: { fontSize: 16 },
  count: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2A3F',
  },
});
