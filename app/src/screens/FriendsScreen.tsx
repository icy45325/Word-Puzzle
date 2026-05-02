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
import { t } from '../i18n';
import type { Friend } from '../services/types';

export function FriendsScreen() {
  const services = useServices();
  const user = useCurrentUser();
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>
          {t('friends.code', { code: myCode })}
        </Text>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={t('friends.add.placeholder')}
          placeholderTextColor="#6B8AA5"
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>{t('friends.add.button')}</Text>
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
              <Text style={styles.userId}>
                {f.userId.replace(/-/g, '').slice(0, 6).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F2A3F' },
  codeCard: {
    margin: 16,
    backgroundColor: '#1C3D57',
    borderRadius: 12,
    padding: 16,
  },
  codeLabel: {
    fontSize: 16,
    color: '#F7C948',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1C3D57',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    color: '#F7F9FC',
    fontSize: 14,
    letterSpacing: 1.4,
  },
  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F7C948',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#0F2A3F', fontWeight: '700' },
  toast: {
    color: '#F7C948',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 13,
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { fontSize: 14, color: '#9AB8CF' },
  emptySub: { marginTop: 8, fontSize: 12, color: '#6B8AA5', textAlign: 'center' },
  list: { paddingHorizontal: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C3D57',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  name: { color: '#F7F9FC', fontSize: 15, fontWeight: '600' },
  userId: { color: '#9AB8CF', fontSize: 12 },
});
