import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEconomy } from '../hooks/useEconomy';
import { ThemePickerModal } from './ThemePickerModal';

export function TopBar() {
  const { state } = useEconomy();
  const [picker, setPicker] = useState(false);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.pill}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.value}>{state?.coins ?? 0}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.icon}>💡</Text>
          <Text style={styles.value}>{state?.hints ?? 0}</Text>
        </View>
      </View>
      <Pressable style={styles.themeBtn} onPress={() => setPicker(true)}>
        <Text style={styles.themeIcon}>🎨</Text>
      </Pressable>
      <ThemePickerModal visible={picker} onClose={() => setPicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  left: { flex: 1, flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  icon: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '900', color: '#F8FAFC' },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: { fontSize: 18 },
});
