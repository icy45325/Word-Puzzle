import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys } from '../store/storage';

export interface AppSettings {
  sound: boolean;
  haptics: boolean;
}

const DEFAULTS: AppSettings = {
  sound: true,
  haptics: true,
};

// In-memory mirror so non-reactive callers (e.g. soundService.play() called
// from imperative code paths) can read settings without re-reading
// AsyncStorage on every event.
let cached: AppSettings = { ...DEFAULTS };
let loaded = false;
const listeners = new Set<(s: AppSettings) => void>();

async function persist(next: AppSettings): Promise<void> {
  cached = next;
  for (const fn of listeners) fn(next);
  try {
    await AsyncStorage.setItem(keys.settings(), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(keys.settings());
    if (raw) {
      const parsed = JSON.parse(raw);
      cached = { ...DEFAULTS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  loaded = true;
  for (const fn of listeners) fn(cached);
  return cached;
}

export function getSettings(): AppSettings {
  return cached;
}

export function useSettings(): {
  settings: AppSettings;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  loaded: boolean;
} {
  const [state, setState] = useState<AppSettings>(cached);
  const [isLoaded, setIsLoaded] = useState(loaded);

  useEffect(() => {
    if (!loaded) {
      loadSettings().then((s) => {
        setState(s);
        setIsLoaded(true);
      });
    }
    const fn = (s: AppSettings) => setState(s);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const setSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const next = { ...cached, [key]: value };
      persist(next);
    },
    []
  );

  return { settings: state, setSetting, loaded: isLoaded };
}
