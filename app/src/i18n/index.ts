import AsyncStorage from '@react-native-async-storage/async-storage';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import { keys } from '../store/storage';

type Dict = Record<string, string>;
const locales: Record<string, Dict> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export type LocaleId = 'zh-CN' | 'en-US';

let currentLocale: LocaleId = 'zh-CN';

// Tiny pub-sub so React components can re-render after a runtime
// language switch. Each subscriber is a no-arg callback; we increment a
// version internally and let consumers `useSyncExternalStore` against it.
type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

export function subscribeLocale(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLocaleVersion(): number {
  return version;
}

export function getLocale(): LocaleId {
  return currentLocale;
}

export function setLocale(locale: LocaleId): void {
  if (!locales[locale] || currentLocale === locale) return;
  currentLocale = locale;
  version += 1;
  AsyncStorage.setItem(keys.locale(), locale).catch(() => undefined);
  for (const fn of listeners) fn();
}

// Load any persisted locale on app start. Call once from App.tsx before
// the first render returns; failure is non-fatal — we just keep zh-CN.
export async function loadPersistedLocale(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(keys.locale());
    if (raw && locales[raw]) {
      currentLocale = raw as LocaleId;
      version += 1;
      for (const fn of listeners) fn();
    }
  } catch {
    /* ignore */
  }
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
  fallback?: string
): string {
  const raw = locales[currentLocale]?.[key] ?? locales['zh-CN']?.[key] ?? fallback ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
