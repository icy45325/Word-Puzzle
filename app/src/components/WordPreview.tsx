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
    minWidth: 160,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginVertical: 8,
  },
  text: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#F7C948',
    textAlign: 'center',
  },
});
