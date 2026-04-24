import zhCN from './locales/zh-CN.json';

type Dict = Record<string, string>;
const locales: Record<string, Dict> = {
  'zh-CN': zhCN,
};

let currentLocale = 'zh-CN';

export function setLocale(locale: string): void {
  if (locales[locale]) currentLocale = locale;
}

export function t(key: string, fallback?: string): string {
  return locales[currentLocale]?.[key] ?? fallback ?? key;
}
