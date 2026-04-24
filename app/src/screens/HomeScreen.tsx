import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '../i18n';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('home.title')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        <Text style={styles.tagline}>{t('home.tagline')}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.primaryText}>{t('home.start')}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.secondaryText}>{t('home.profile')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F7C948',
    letterSpacing: 2,
  },
  subtitle: { marginTop: 8, fontSize: 16, color: '#CFE3F5' },
  tagline: {
    marginTop: 24,
    fontSize: 14,
    color: '#CFE3F5',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  primaryBtn: {
    marginTop: 48,
    paddingHorizontal: 40,
    paddingVertical: 14,
    backgroundColor: '#F7C948',
    borderRadius: 999,
  },
  primaryText: { fontSize: 18, fontWeight: '800', color: '#0F2A3F' },
  secondaryBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderColor: '#F7C948',
    borderWidth: 1,
  },
  secondaryText: { fontSize: 14, fontWeight: '600', color: '#F7C948' },
});
