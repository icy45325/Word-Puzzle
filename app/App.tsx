import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { ServicesProvider, useCurrentUser, useServices } from './src/services';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { VocabularyScreen } from './src/screens/VocabularyScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ReviewQuizScreen } from './src/screens/ReviewQuizScreen';
import { StoreScreen } from './src/screens/StoreScreen';
import { loadPersistedLocale } from './src/i18n';
import { useLocale } from './src/i18n/useLocale';
import { loadSettings } from './src/hooks/useSettings';
import { soundService } from './src/services/sound/SoundService';
import {
  notificationsService,
  type DeepLink,
} from './src/services/notifications/NotificationsService';

loadPersistedLocale();
loadSettings();
soundService.preload();

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Map: undefined;
  Profile: undefined;
  Vocabulary: undefined;
  Leaderboard: undefined;
  Friends: undefined;
  Login: undefined;
  ReviewQuiz: undefined;
  Store: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
// Navigation ref so notification tap listeners (outside React tree) can
// route to a screen.
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

function navigateForDeepLink(link: DeepLink): void {
  // Always clear the badge when the user comes back from a notification.
  notificationsService.clearBadgeAndDismissed();
  if (!navigationRef.isReady()) return;
  if (link === 'review') {
    navigationRef.navigate('ReviewQuiz');
  } else {
    // 'dailyCheckIn' and 'home' both land on Home — TopBar there will
    // auto-open the daily check-in modal once economy state loads.
    navigationRef.navigate('Home');
  }
}

/** Notification side-effects bridged into the React tree so they have
 *  access to `services` / `user`. Renders nothing. */
function NotificationsBridge() {
  const services = useServices();
  const user = useCurrentUser();
  const armedRef = useRef(false);

  // Re-arm tomorrow's daily / review reminders on every cold start so
  // schedules survive uninstall-reinstall and stay current with today's
  // due-word count. One-shot per session.
  useEffect(() => {
    if (!user || armedRef.current) return;
    armedRef.current = true;
    (async () => {
      if (!(await notificationsService.isOptedIn())) return;
      try {
        await notificationsService.scheduleDailyCheckIn();
        const due = await services.learnedWords.getDue(user.userId);
        await notificationsService.scheduleReviewDue(due.length);
      } catch {
        /* swallow — non-critical */
      }
    })();
  }, [services, user]);

  // Clear the app icon badge on initial mount + every time the app
  // returns to foreground. Without this, the launcher icon keeps a stale
  // "1" / "N" count even after the user has opened the app and seen the
  // reminder.
  useEffect(() => {
    notificationsService.clearBadgeAndDismissed();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        notificationsService.clearBadgeAndDismissed();
      }
    });
    return () => sub.remove();
  }, []);

  // Listen for taps on scheduled notifications and deep-link.
  useEffect(() => {
    const unsubscribe = notificationsService.addResponseListener(
      navigateForDeepLink
    );
    // Also handle cold-start: app launched FROM a notification tap.
    notificationsService.getLaunchDeepLink().then((link) => {
      if (link) {
        // Delay so the navigator is mounted before we try to navigate.
        setTimeout(() => navigateForDeepLink(link), 300);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return null;
}

export default function App() {
  useLocale();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ServicesProvider>
            <NotificationsBridge />
            <NavigationContainer ref={navigationRef}>
              <Stack.Navigator screenOptions={screenOptions}>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Game" component={GameScreen} />
                <Stack.Screen name="Map" component={MapScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
                <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
                <Stack.Screen name="Friends" component={FriendsScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="ReviewQuiz" component={ReviewQuizScreen} />
                <Stack.Screen name="Store" component={StoreScreen} />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
          </ServicesProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
