// Theme registry. Each theme = a 3-stop background gradient + a primary
// accent color used for the play button and detail-modal headers.
//
// Tailwind class -> hex equivalents kept inline as comments so the visual
// reference back to the HTML prototype is obvious.

export type ThemeId = 'aurora' | 'sunset' | 'midnight' | 'mint';

export interface Theme {
  id: ThemeId;
  name: string;
  /** 3-stop linear gradient [from, via, to] */
  gradient: readonly [string, string, string];
  /** Bold accent (play button bg, modal header bg) */
  primary: string;
  /** Text color that reads cleanly on the primary bg */
  primaryText: string;
  /** Soft accent (secondary highlights, link text) */
  accent: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  aurora: {
    id: 'aurora',
    name: '极光之森',
    // from-indigo-950 via-blue-900 to-emerald-950
    gradient: ['#1E1B4B', '#1E3A8A', '#022C22'] as const,
    primary: '#10B981', // emerald-500
    primaryText: '#022C22',
    accent: '#6EE7B7', // emerald-300
  },
  sunset: {
    id: 'sunset',
    name: '落日余晖',
    // from-orange-600 via-rose-500 to-purple-900
    gradient: ['#EA580C', '#F43F5E', '#581C87'] as const,
    primary: '#F43F5E', // rose-500
    primaryText: '#FFFFFF',
    accent: '#FCD34D', // yellow-300
  },
  midnight: {
    id: 'midnight',
    name: '深海之梦',
    // from-slate-900 via-blue-950 to-black
    gradient: ['#0F172A', '#172554', '#000000'] as const,
    primary: '#2563EB', // blue-600
    primaryText: '#FFFFFF',
    accent: '#22D3EE', // cyan-400
  },
  mint: {
    id: 'mint',
    name: '薄荷清晨',
    // from-teal-600 via-cyan-700 to-blue-800
    gradient: ['#0D9488', '#0E7490', '#1E40AF'] as const,
    primary: '#14B8A6', // teal-500
    primaryText: '#FFFFFF',
    accent: '#99F6E4', // teal-200
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'aurora';

export const ALL_THEMES: Theme[] = [
  THEMES.aurora,
  THEMES.sunset,
  THEMES.midnight,
  THEMES.mint,
];
