import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  word: string;
  /** True when the user is actively forming a word. While idle the
   *  component takes up zero visual space — no placeholder text — to
   *  avoid crowding the wheel. */
  active?: boolean;
}

export function WordPreview({ word, active }: Props) {
  if (!active) {
    // Reserve a small fixed-height slot so the wheel doesn't jump up
    // when the user starts swiping. Nothing visible.
    return <View style={styles.idleSpacer} />;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{word || ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Active pill — shown while the user is mid-swipe, big white capsule
  container: {
    alignSelf: 'center',
    minWidth: 140,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  text: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#0F172A',
    textAlign: 'center',
  },
  // Same total height as the active pill so the layout stays stable.
  idleSpacer: {
    alignSelf: 'center',
    height: 56,
  },
});
