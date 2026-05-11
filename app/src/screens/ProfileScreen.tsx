import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useServices } from '../services';
import { AnonymousAuth } from '../services/auth/AnonymousAuth';
import { useEconomy } from '../hooks/useEconomy';
import { useUnlocks } from '../hooks/useUnlocks';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useSettings } from '../hooks/useSettings';
import { feedback } from '../utils/feedback';
import { notificationsService } from '../services/notifications/NotificationsService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { state } = useEconomy();
  const unlocks = useUnlocks();
  const { theme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { settings, setSetting } = useSettings();
  const [learnedCount, setLearnedCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [notifOptedIn, setNotifOptedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    notificationsService.isOptedIn().then((v) => {
      if (!cancelled) setNotifOptedIn(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleNotif = async (value: boolean) => {
    if (value) {
      const ok = await notificationsService.requestPermission();
      if (!ok) {
        setNotifOptedIn(false);
        return;
      }
      await notificationsService.setOptedIn(true);
      setNotifOptedIn(true);
      // Immediately arm tomorrow's reminders so opt-in feels real.
      notificationsService.scheduleDailyCheckIn();
      if (user) {
        const due = await services.learnedWords.getDue(user.userId);
        notificationsService.scheduleReviewDue(due.length);
      }
    } else {
      await notificationsService.setOptedIn(false);
      setNotifOptedIn(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    services.learnedWords.list(user.userId).then((list) => {
      if (cancelled) return;
      setLearnedCount(list.length);
    });
    return () => {
      cancelled = true;
    };
  }, [services, user]);

  const openEdit = () => {
    if (!user) return;
    setDraft(user.displayName);
    setEditing(true);
  };

  const saveEdit = async () => {
    const auth = services.auth as AnonymousAuth;
    if (typeof auth.setDisplayName === 'function') {
      await auth.setDisplayName(draft);
    }
    setEditing(false);
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
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Pressable onPress={openEdit} style={styles.nameRow}>
              <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </Pressable>
            <Text style={styles.sub}>
              {user?.isAnonymous ? t('profile.guest') : 'Signed in'}
            </Text>
            <View style={styles.statsGrid}>
              <Stat label={t('profile.coins')} value={`${state?.coins ?? 0}`} />
              <Stat label={t('profile.hints')} value={`${state?.hints ?? 0}`} />
              <Stat
                label={t('profile.furthest')}
                value={`L${unlocks.furthestLevel}`}
              />
              <Stat label={t('profile.learnedCount')} value={`${learnedCount}`} />
            </View>
          </View>

          <View style={styles.langCard}>
            <Text style={styles.langLabel}>
              {t('profile.feedbackLabel', undefined, '声音与震动')}
            </Text>
            <ToggleRow
              icon="🔊"
              label={t('profile.soundLabel', undefined, '音效')}
              value={settings.sound}
              onChange={(v) => {
                setSetting('sound', v);
                if (v) feedback('coin');
              }}
              theme={theme}
            />
            <ToggleRow
              icon="📳"
              label={t('profile.hapticsLabel', undefined, '触觉反馈')}
              value={settings.haptics}
              onChange={(v) => {
                setSetting('haptics', v);
                if (v) feedback('tick');
              }}
              theme={theme}
            />
            <ToggleRow
              icon="🔔"
              label={t('profile.notificationsLabel', undefined, '推送提醒')}
              value={notifOptedIn}
              onChange={toggleNotif}
              theme={theme}
            />
          </View>

          <View style={styles.langCard}>
            <Text style={styles.langLabel}>{t('profile.language')}</Text>
            <View style={styles.langRow}>
              <Pressable
                style={[
                  styles.langBtn,
                  locale === 'zh-CN' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setLocale('zh-CN')}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    locale === 'zh-CN' && { color: theme.primaryText },
                  ]}
                >
                  {t('profile.languageChinese')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.langBtn,
                  locale === 'en-US' && { backgroundColor: theme.primary },
                ]}
                onPress={() => setLocale('en-US')}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    locale === 'en-US' && { color: theme.primaryText },
                  ]}
                >
                  {t('profile.languageEnglish')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.linkBtn, { backgroundColor: theme.primary }]}
            onPress={async () => {
              if (user?.isAnonymous) {
                navigation.navigate('Login');
              } else {
                await services.auth.signOut();
              }
            }}
          >
            <Text style={[styles.linkText, { color: theme.primaryText }]}>
              🔗 {user?.isAnonymous ? t('profile.linkAccount') : t('profile.signOut')}
            </Text>
          </Pressable>
          <Text style={styles.actionHint}>{t('login.googleHint')}</Text>
        </View>

        <Modal
          visible={editing}
          transparent
          animationType="fade"
          onRequestClose={() => setEditing(false)}
        >
          <Pressable
            style={styles.editBackdrop}
            onPress={() => setEditing(false)}
          />
          <View style={styles.editCardWrap}>
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>
                {t('profile.editName', undefined, '修改昵称')}
              </Text>
              <TextInput
                style={styles.editInput}
                value={draft}
                onChangeText={setDraft}
                autoFocus
                maxLength={24}
                placeholder={t('profile.editNamePlaceholder', undefined, '输入新昵称')}
                placeholderTextColor="#94A3B8"
              />
              <View style={styles.editButtons}>
                <Pressable
                  style={[styles.editBtn, styles.editBtnGhost]}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.editBtnGhostText}>
                    {t('profile.editCancel', undefined, '取消')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.editBtn, { backgroundColor: theme.primary }]}
                  onPress={saveEdit}
                >
                  <Text style={[styles.editBtnText, { color: theme.primaryText }]}>
                    {t('profile.editSave', undefined, '保存')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface ToggleRowProps {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  theme: { primary: string };
}

function ToggleRow({ icon, label, value, onChange, theme }: ToggleRowProps) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <Text style={styles.toggleIcon}>{icon}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View
        style={[
          styles.toggleTrack,
          value && { backgroundColor: theme.primary },
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            value ? styles.toggleThumbOn : styles.toggleThumbOff,
          ]}
        />
      </View>
    </Pressable>
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
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '900', color: '#F8FAFC' },
  editIcon: { fontSize: 16, opacity: 0.7 },
  sub: { marginTop: 4, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  statsGrid: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  stat: { minWidth: 100 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#FACC15' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '700', letterSpacing: 1 },
  langCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
  },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  langBtnText: { color: '#F8FAFC', fontWeight: '900', fontSize: 14 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  toggleIcon: { fontSize: 18 },
  toggleLabel: { flex: 1, color: '#F8FAFC', fontWeight: '700', fontSize: 14 },
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleThumbOff: { alignSelf: 'flex-start' },
  linkBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  linkText: { fontSize: 15, fontWeight: '900' },
  actionHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    paddingHorizontal: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  editBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  editCardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  editCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    gap: 14,
  },
  editTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  editInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  editButtons: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnGhost: { backgroundColor: '#F1F5F9' },
  editBtnGhostText: { color: '#64748B', fontWeight: '900' },
  editBtnText: { fontWeight: '900', fontSize: 14 },
});
