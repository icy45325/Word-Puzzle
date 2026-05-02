import zhCN from './locales/zh-CN.json';

type Dict = Record<string, string>;
const locales: Record<string, Dict> = {
  'zh-CN': zhCN,
};

let currentLocale = 'zh-CN';

export function setLocale(locale: string): void {
  if (locales[locale]) currentLocale = locale;
}

export function t(
  key: string,
  vars?: Record<string, string | number>,
  fallback?: string
): string {
  const raw = locales[currentLocale]?.[key] ?? fallback ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
