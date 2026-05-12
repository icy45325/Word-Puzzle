// Local push notifications (no remote / FCM yet). Schedules:
//   1. Daily check-in reminder — fires ~10am the morning after the
//      player's last claim.
//   2. Review-due reminder — fires ~10:05am if the player has SR-due
//      words and hasn't opened the quiz yet.
//   3. Streak-at-risk warning — fires ~9pm if the player has a streak
//      ≥ 2 and still hasn't claimed today.
//   4. One-shot welcome — fired ~5s after opt-in so the user immediately
//      sees what notifications look like and that they actually work.
//
// All notifications carry a `data.deepLink` payload that App.tsx reads
// when the user taps one, routing them to the right screen (Home for
// daily check-in, ReviewQuiz for review). Designed to no-op gracefully
// when expo-notifications isn't linked (Expo Go).

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys } from '../../store/storage';
import { getLocale, t } from '../../i18n';

let notif: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  notif = require('expo-notifications');
} catch {
  notif = null;
}

const STORAGE_OPTED_IN = `${keys.settings()}:notifications`;
const DAILY_REMINDER_ID = 'wordscapes-daily-checkin';
const REVIEW_REMINDER_ID = 'wordscapes-review-due';
const STREAK_WARNING_ID = 'wordscapes-streak-warning';
const WELCOME_ID = 'wordscapes-welcome';

export type DeepLink = 'dailyCheckIn' | 'review' | 'home';

let configured = false;

function isAvailable(): boolean {
  return notif != null && typeof notif.scheduleNotificationAsync === 'function';
}

async function ensureConfigured(): Promise<void> {
  if (configured || !isAvailable()) return;
  configured = true;
  try {
    notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await notif.setNotificationChannelAsync('engagement', {
        name: 'Daily reminders',
        importance: notif.AndroidImportance?.DEFAULT ?? 3,
        vibrationPattern: [0, 120, 80, 120],
        lightColor: '#FACC15',
      });
    }
  } catch {
    /* swallow — handler is non-critical */
  }
}

export async function isOptedIn(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_OPTED_IN);
    if (raw == null) return false;
    return raw === '1';
  } catch {
    return false;
  }
}

export async function setOptedIn(value: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_OPTED_IN, value ? '1' : '0');
  if (!value) {
    await cancelAll();
  }
}

/** Prompts the user for notification permission. Returns true if granted. */
export async function requestPermission(): Promise<boolean> {
  if (!isAvailable()) return false;
  await ensureConfigured();
  try {
    const existing = await notif.getPermissionsAsync();
    if (existing.granted) return true;
    if (existing.canAskAgain === false) return false;
    const result = await notif.requestPermissionsAsync();
    return !!result.granted;
  } catch {
    return false;
  }
}

async function cancelAll(): Promise<void> {
  if (!isAvailable()) return;
  try {
    await Promise.all([
      notif.cancelScheduledNotificationAsync(DAILY_REMINDER_ID),
      notif.cancelScheduledNotificationAsync(REVIEW_REMINDER_ID),
      notif.cancelScheduledNotificationAsync(STREAK_WARNING_ID),
      notif.cancelScheduledNotificationAsync(WELCOME_ID),
    ]);
  } catch {
    /* ignore */
  }
}

function nextDayAt(hour: number, minute: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Time of today at given hour, or tomorrow if already past that time. */
function todayOrTomorrowAt(hour: number, minute: number = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function tx(key: string, fallback: string, vars?: Record<string, string | number>): string {
  void getLocale(); // pull current locale into the closure
  return t(key, vars, fallback);
}

async function schedule(
  identifier: string,
  title: string,
  body: string,
  fireAt: Date,
  deepLink: DeepLink
): Promise<void> {
  if (!isAvailable()) return;
  await ensureConfigured();
  try {
    await notif.cancelScheduledNotificationAsync(identifier);
    await notif.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        data: { deepLink },
      },
      trigger: {
        type: notif.SchedulableTriggerInputTypes?.DATE ?? 'date',
        date: fireAt,
        channelId: 'engagement',
      } as any,
    });
  } catch {
    /* ignore */
  }
}

export async function scheduleDailyCheckIn(): Promise<void> {
  if (!(await isOptedIn())) return;
  await schedule(
    DAILY_REMINDER_ID,
    tx('notif.dailyCheckIn.title', '别错过签到 🔥'),
    tx('notif.dailyCheckIn.body', '继续连胜可以领更多金币，每天 10 秒搞定。'),
    nextDayAt(10),
    'dailyCheckIn'
  );
}

export async function scheduleReviewDue(dueCount: number): Promise<void> {
  if (!isAvailable()) return;
  if (!(await isOptedIn())) return;
  await ensureConfigured();
  try {
    await notif.cancelScheduledNotificationAsync(REVIEW_REMINDER_ID);
    if (dueCount <= 0) return;
    await schedule(
      REVIEW_REMINDER_ID,
      tx('notif.review.title', '复习单词 📚'),
      tx('notif.review.body', '{count} 个词到期了，答对得金币。', { count: dueCount }),
      nextDayAt(10, 5),
      'review'
    );
  } catch {
    /* ignore */
  }
}

/** Evening "你的连胜可能要断了" reminder. Fires ~9pm if the user already
 *  has a streak going. Called right after a claim, so the warning fires
 *  for *tomorrow's* end-of-day. If user opens app and claims tomorrow,
 *  this is re-armed for the day after. */
export async function scheduleStreakWarning(currentStreak: number): Promise<void> {
  if (!isAvailable()) return;
  if (!(await isOptedIn())) return;
  if (currentStreak < 2) {
    // No streak to lose yet — skip the warning to avoid noise.
    await notif.cancelScheduledNotificationAsync(STREAK_WARNING_ID);
    return;
  }
  await schedule(
    STREAK_WARNING_ID,
    tx('notif.streakWarning.title', '🔥 别让连胜断了'),
    tx('notif.streakWarning.body', '{days} 天连胜，今天还没签到～', { days: currentStreak }),
    // 9pm tomorrow — far enough from the morning reminder to feel distinct
    nextDayAt(21),
    'dailyCheckIn'
  );
}

/** Fire a confirmation notification ~5s after the user opts in. Lets them
 *  immediately see what reminders look like, builds trust. */
export async function scheduleWelcome(): Promise<void> {
  if (!isAvailable()) return;
  if (!(await isOptedIn())) return;
  await ensureConfigured();
  try {
    const fireAt = new Date(Date.now() + 5000);
    await notif.scheduleNotificationAsync({
      identifier: WELCOME_ID,
      content: {
        title: tx('notif.welcome.title', '✅ 推送已开启'),
        body: tx('notif.welcome.body', '每天 10 点提醒你签到 + 复习到期的词。'),
        data: { deepLink: 'home' as DeepLink },
      },
      trigger: {
        type: notif.SchedulableTriggerInputTypes?.DATE ?? 'date',
        date: fireAt,
        channelId: 'engagement',
      } as any,
    });
  } catch {
    /* ignore */
  }
}

/** Read the deep link payload from a notification response. Returns null
 *  if the response doesn't carry our data shape. */
export function readDeepLink(response: any): DeepLink | null {
  try {
    const data = response?.notification?.request?.content?.data;
    if (data && typeof data.deepLink === 'string') {
      return data.deepLink as DeepLink;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Subscribe to taps. Returns an unsubscribe function. */
export function addResponseListener(
  cb: (link: DeepLink) => void
): (() => void) | null {
  if (!isAvailable()) return null;
  try {
    const sub = notif.addNotificationResponseReceivedListener((response: any) => {
      const link = readDeepLink(response);
      if (link) cb(link);
    });
    return () => sub.remove();
  } catch {
    return null;
  }
}

/** Get the notification that launched the app (if any). Useful at app
 *  boot to deep-link on cold start. */
export async function getLaunchDeepLink(): Promise<DeepLink | null> {
  if (!isAvailable()) return null;
  try {
    const response = await notif.getLastNotificationResponseAsync();
    return readDeepLink(response);
  } catch {
    return null;
  }
}

export const notificationsService = {
  isAvailable,
  isOptedIn,
  setOptedIn,
  requestPermission,
  scheduleDailyCheckIn,
  scheduleReviewDue,
  scheduleStreakWarning,
  scheduleWelcome,
  cancelAll,
  addResponseListener,
  getLaunchDeepLink,
};
