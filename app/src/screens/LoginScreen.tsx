import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoogleSignIn } from '../services/auth/GoogleAuth';
import { useServices } from '../services';
import { AnonymousAuth } from '../services/auth/AnonymousAuth';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { AppLogo } from '../components/AppLogo';
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
          // user cancelled, leave state as-is
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
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          <AppLogo size={96} />
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          <Pressable
            style={[
              styles.googleBtn,
              (!ready || busy) && styles.disabled,
            ]}
            onPress={handleGoogle}
            disabled={busy}
          >
            <Text style={styles.googleText}>{t('login.google')}</Text>
          </Pressable>
          <Text style={styles.hint}>{t('login.googleHint')}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: { paddingHorizontal: 20, paddingTop: 8 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#F8FAFC', marginTop: -3 },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  title: { marginTop: 16, fontSize: 26, fontWeight: '900', color: '#F8FAFC' },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 260,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  disabled: { opacity: 0.5 },
  googleText: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  hint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    lineHeight: 16,
  },
  error: { color: '#F87171', fontSize: 13, marginTop: 12 },
});
