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
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { VocabularyScreen } from './src/screens/VocabularyScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  Profile: undefined;
  Vocabulary: undefined;
  Leaderboard: undefined;
  Friends: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: '#0F2A3F' },
  headerTintColor: '#F7C948',
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: '#0F2A3F' },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ServicesProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={screenOptions}>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="Game" component={GameScreen} options={{ title: '拼词 Game' }} />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: '我的 Profile' }}
              />
              <Stack.Screen
                name="Vocabulary"
                component={VocabularyScreen}
                options={{ title: '我的词表 Vocabulary' }}
              />
              <Stack.Screen
                name="Leaderboard"
                component={LeaderboardScreen}
                options={{ title: '排行榜 Leaderboard' }}
              />
              <Stack.Screen
                name="Friends"
                component={FriendsScreen}
                options={{ title: '好友 Friends' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </ServicesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
