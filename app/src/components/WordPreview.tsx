import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  word: string;
}

export function WordPreview({ word }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{word || ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    minWidth: 180,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  text: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#0F172A',
    textAlign: 'center',
  },
});
