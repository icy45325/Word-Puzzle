import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useServices } from '../services';
import { useEconomy } from '../hooks/useEconomy';

export function CoinHud() {
  const services = useServices();
  const { state } = useEconomy();
  const hintAvailable = services.remoteConfig.getBool('hint.available', false);

  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Text style={styles.icon}>🪙</Text>
        <Text style={styles.value}>{state?.coins ?? 0}</Text>
      </View>
      <Pressable
        style={[styles.pill, !hintAvailable && styles.pillDisabled]}
        disabled={!hintAvailable}
        onPress={() => {}}
      >
        <Text style={styles.icon}>💡</Text>
        <Text style={styles.value}>{state?.hints ?? 0}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3D57',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  pillDisabled: { opacity: 0.4 },
  icon: { fontSize: 16 },
  value: { fontSize: 14, fontWeight: '700', color: '#F7F9FC' },
});
