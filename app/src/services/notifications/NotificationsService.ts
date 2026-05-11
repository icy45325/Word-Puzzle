// Local push notifications (no remote / FCM yet). Schedules:
//   1. "Daily check-in" reminder — fires the morning after the player's
//      last check-in, anchored to ~10am local time so it lands during
//      typical phone-pickup hours.
//   2. "Review due" reminder — fires when the user has SR-due words and
//      hasn't opened the review quiz today, also anchored to ~10am.
//
// Both notifications are cancellable; we re-schedule on every claim /
// economy change so the cadence stays in sync with the user's actual
// activity. Designed to no-op gracefully if expo-notifications isn't
// linked (e.g. running in Expo Go on iOS — Android works fine).

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

let configured = false;

function isAvailable(): boolean {
  return notif != null && typeof notif.scheduleNotificationAsync === 'function';
}

async function ensureConfigured(): Promise<void> {
  if (configured || !isAvailable()) return;
  configured = true;
  // Foreground display defaults — when the app is in the foreground we
  // still want the system banner / sound. Without this, scheduled
  // notifications fire silently in foreground.
  try {
    notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      // A single low-priority "engagement" channel for both reminders.
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
    await notif.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await notif.cancelScheduledNotificationAsync(REVIEW_REMINDER_ID);
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

function localizedBody(key: string, fallback: string, vars?: Record<string, string | number>): string {
  // Tag the locale into the body so we don't need a separate channel per
  // language — at schedule time we pull whichever locale is active.
  void getLocale();
  return t(key, vars, fallback);
}

/** Re-schedule (replace) the daily check-in reminder for tomorrow ~10am. */
export async function scheduleDailyCheckIn(): Promise<void> {
  if (!isAvailable()) return;
  if (!(await isOptedIn())) return;
  await ensureConfigured();
  try {
    await notif.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    const fireAt = nextDayAt(10);
    await notif.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: localizedBody('notif.dailyCheckIn.title', '别错过签到 🔥'),
        body: localizedBody(
          'notif.dailyCheckIn.body',
          '继续连胜可以领更多金币，每天 10 秒搞定。'
        ),
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

/** Re-schedule (replace) the review-due reminder. Pass the count of words
 *  currently due; we tag it into the body. Fires ~10am tomorrow. */
export async function scheduleReviewDue(dueCount: number): Promise<void> {
  if (!isAvailable()) return;
  if (!(await isOptedIn())) return;
  await ensureConfigured();
  try {
    await notif.cancelScheduledNotificationAsync(REVIEW_REMINDER_ID);
    if (dueCount <= 0) return; // nothing to remind about
    const fireAt = nextDayAt(10, 5); // 5 min offset from check-in slot
    await notif.scheduleNotificationAsync({
      identifier: REVIEW_REMINDER_ID,
      content: {
        title: localizedBody('notif.review.title', '复习单词 📚'),
        body: localizedBody('notif.review.body', '{count} 个词到期了，答对得金币。', {
          count: dueCount,
        }),
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

export const notificationsService = {
  isAvailable,
  isOptedIn,
  setOptedIn,
  requestPermission,
  scheduleDailyCheckIn,
  scheduleReviewDue,
  cancelAll,
};
