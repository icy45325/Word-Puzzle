import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  word: string;
  /** True when the user is actively forming a word — render the bold
   *  letters pill. False renders a small hint pill that doesn't crowd
   *  the wheel below. */
  active?: boolean;
}

export function WordPreview({ word, active }: Props) {
  if (!active) {
    return (
      <View style={styles.hintWrap}>
        <Text style={styles.hintText}>{word}</Text>
      </View>
    );
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
  // Idle hint — small italic text, doesn't crowd anything
  hintWrap: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
});
