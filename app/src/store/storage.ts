import AsyncStorage from '@react-native-async-storage/async-storage';

export const NAMESPACE = 'ws';
// Bumped to 3 when levels.json was regenerated under CEFR (v6): old
// levelIds like "L01"..."L200" reference completely different content
// now, so foundWordsByLevel / completedLevelIds from v2 saves point at
// the wrong content. The migration clears those two fields but keeps
// furthestLevelIndex (numeric, content-independent).
export const CURRENT_SCHEMA_VERSION = 3;

export const keys = {
  user: () => `${NAMESPACE}:user`,
  progress: (userId: string) => `${NAMESPACE}:${userId}:progress`,
  economy: (userId: string) => `${NAMESPACE}:${userId}:economy`,
  scores: (userId: string) => `${NAMESPACE}:${userId}:scores`,
  entitlements: (userId: string) => `${NAMESPACE}:${userId}:entitlements`,
  learnedWords: (userId: string) => `${NAMESPACE}:${userId}:learnedWords`,
  friends: (userId: string) => `${NAMESPACE}:${userId}:friends`,
  locale: () => `${NAMESPACE}:locale`,
  settings: () => `${NAMESPACE}:settings`,
  onboarding: (key: string) => `${NAMESPACE}:onboarding:${key}`,
};

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function moveKey(fromKey: string, toKey: string): Promise<void> {
  const val = await AsyncStorage.getItem(fromKey);
  if (val == null) return;
  await AsyncStorage.setItem(toKey, val);
  await AsyncStorage.removeItem(fromKey);
}
