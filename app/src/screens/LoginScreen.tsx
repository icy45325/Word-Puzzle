import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoogleSignIn } from '../services/auth/GoogleAuth';
import { useServices } from '../services';
import { AnonymousAuth } from '../services/auth/AnonymousAuth';
import { t } from '../i18n';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const services = useServices();
  const { promptSignIn, ready } = useGoogleSignIn();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await promptSignIn();
      if (!result.ok || !result.identity) {
        if (result.reason === 'no_clients') {
          setError(t('login.googleHint'));
        } else if (result.reason === 'cancelled') {
          // user cancelled, leave the screen state as-is
        } else {
          setError(t('login.error'));
        }
        return;
      }
      const auth = services.auth as AnonymousAuth;
      await auth.linkWithIdentity(result.identity);
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        <Pressable
          style={[styles.googleBtn, !ready && styles.disabled, busy && styles.disabled]}
          onPress={handleGoogle}
          disabled={busy}
        >
          <Text style={styles.googleText}>{t('login.google')}</Text>
        </Pressable>
        <Text style={styles.hint}>{t('login.googleHint')}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#F7C948' },
  subtitle: {
    color: '#9AB8CF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  googleBtn: {
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 240,
    alignItems: 'center',
    marginTop: 12,
  },
  disabled: { opacity: 0.5 },
  googleText: { fontSize: 16, fontWeight: '700', color: '#0F2A3F' },
  hint: {
    fontSize: 11,
    color: '#6B8AA5',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  error: { color: '#F77070', fontSize: 13, marginTop: 12 },
});
