import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import type { Friend } from '../services/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { theme } = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [code, setCode] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const myCode = user ? services.leaderboard.myFriendCode(user.userId) : '';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    services.leaderboard.listFriends(user.userId).then((list) => {
      if (cancelled) return;
      setFriends(list);
    });
    return () => {
      cancelled = true;
    };
  }, [services, user]);

  const handleAdd = async () => {
    if (!user) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const result = await services.leaderboard.addFriend(user.userId, trimmed);
    if (!result.ok) {
      setToast(t('friends.comingSoon'));
      setTimeout(() => setToast(null), 1800);
      return;
    }
    setCode('');
    const list = await services.leaderboard.listFriends(user.userId);
    setFriends(list);
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
          <Text style={styles.title}>好友</Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>
            {t('friends.code', { code: myCode })}
          </Text>
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder={t('friends.add.placeholder')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
          <Pressable
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleAdd}
          >
            <Text style={[styles.addBtnText, { color: theme.primaryText }]}>
              {t('friends.add.button')}
            </Text>
          </Pressable>
        </View>

        {toast ? <Text style={styles.toast}>{toast}</Text> : null}

        {friends.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{t('friends.empty')}</Text>
            <Text style={styles.emptySub}>{t('friends.comingSoon')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {friends.map((f) => (
              <View key={f.userId} style={styles.row}>
                <Text style={styles.name}>{f.displayName}</Text>
                <Text style={styles.userIdTag}>
                  {f.userId.replace(/-/g, '').slice(0, 6).toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#F8FAFC', marginTop: -3 },
  title: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.5 },
  codeCard: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  codeLabel: {
    fontSize: 16,
    color: '#FACC15',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    color: '#F8FAFC',
    fontSize: 14,
    letterSpacing: 1.5,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontWeight: '900' },
  toast: {
    color: '#FACC15',
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  emptySub: { marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
  list: { paddingHorizontal: 20, gap: 8, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  name: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  userIdTag: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },
});
