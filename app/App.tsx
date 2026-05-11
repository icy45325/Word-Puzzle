import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { ServicesProvider } from './src/services';
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
import { loadPersistedLocale } from './src/i18n';
import { useLocale } from './src/i18n/useLocale';
import { loadSettings } from './src/hooks/useSettings';
import { soundService } from './src/services/sound/SoundService';

// Kick off the locale load before the first render returns. The function
// is fire-and-forget; once the persisted value is read, listeners
// (via useLocale) re-render with the new language.
loadPersistedLocale();
// Hydrate the settings cache + warm the audio session so the first
// feedback() call doesn't pay a cold-start cost.
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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
};

export default function App() {
  // Subscribe to locale changes at the root. When ProfileScreen toggles
  // language, the version bump forces App to re-render, which propagates
  // a new render down through every screen — without this, screens that
  // only call t() (not useLocale()) would keep showing stale strings
  // until they were navigated away from and back.
  useLocale();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ServicesProvider>
            <NavigationContainer>
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
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="light" />
          </ServicesProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
