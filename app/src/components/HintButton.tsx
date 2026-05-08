import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useEconomy } from '../hooks/useEconomy';
import type { RevealResult } from '../hooks/useGameState';
import { HintInsufficientSheet } from './HintInsufficientSheet';
import { t } from '../i18n';

interface Props {
  onReveal: () => Promise<RevealResult>;
}

export function HintButton({ onReveal }: Props) {
  const { state } = useEconomy();
  const hints = state?.hints ?? 0;
  const disabled = hints <= 0;
  const [sheetOpen, setSheetOpen] = useState(false);

  const handlePress = useCallback(async () => {
    if (disabled) {
      setSheetOpen(true);
      return;
    }
    const result = await onReveal();
    if (!result.ok && result.reason === 'no_hints') setSheetOpen(true);
  }, [disabled, onReveal]);

  const handleHintGained = useCallback(() => {
    // After the sheet grants a hint, the user explicitly reopened the flow
    // by tapping a refill option. We don't auto-trigger reveal — let them
    // tap 💡 again so they can confirm intent.
  }, []);

  return (
    <>
      <Pressable
        style={[styles.button, disabled && styles.disabled]}
        onPress={handlePress}
      >
        <Text style={styles.icon}>{t('hint.button')}</Text>
        <Text style={styles.count}>{hints}</Text>
      </Pressable>
      <HintInsufficientSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onHintGained={handleHintGained}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 0,
    justifyContent: 'center',
    gap: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  icon: { fontSize: 16 },
  count: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FACC15',
  },
});
