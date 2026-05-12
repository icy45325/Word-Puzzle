import { useSyncExternalStore } from 'react';
import {
  getLocale,
  getLocaleVersion,
  setLocale,
  subscribeLocale,
  type LocaleId,
} from './index';

// Subscribes to locale changes so the calling component re-renders when
// the user toggles the language. The actual `t()` lookup still happens
// at render time and reads `currentLocale` directly.
export function useLocale(): { locale: LocaleId; setLocale: (l: LocaleId) => void } {
  useSyncExternalStore(subscribeLocale, getLocaleVersion, getLocaleVersion);
  return { locale: getLocale(), setLocale };
}
