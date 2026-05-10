// Combined haptic + sound dispatch keyed by feedback kind. Imperative
// callers (LetterWheel pan handlers, useGameState reducers, etc.) call
// `feedback('correct')` and the right buzz + sound fires, gated by the
// user's settings.

import { getSettings } from '../hooks/useSettings';
import { soundService, type SoundKind } from '../services/sound/SoundService';

let haptics: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  haptics = require('expo-haptics');
} catch {
  haptics = null;
}

export type FeedbackKind = SoundKind;

function fireHaptic(kind: FeedbackKind): void {
  if (!haptics) return;
  try {
    switch (kind) {
      case 'tick':
        haptics.selectionAsync();
        break;
      case 'correct':
        haptics.notificationAsync(haptics.NotificationFeedbackType.Success);
        break;
      case 'wrong':
        haptics.notificationAsync(haptics.NotificationFeedbackType.Error);
        break;
      case 'bonus':
        haptics.impactAsync(haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'celebrate':
        haptics.impactAsync(haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'sparkle':
        haptics.impactAsync(haptics.ImpactFeedbackStyle.Light);
        break;
      case 'coin':
        haptics.selectionAsync();
        break;
    }
  } catch {
    /* ignore */
  }
}

export function feedback(kind: FeedbackKind): void {
  const s = getSettings();
  if (s.haptics) fireHaptic(kind);
  if (s.sound) {
    // fire-and-forget; soundService no-ops if asset missing
    soundService.play(kind);
  }
}
