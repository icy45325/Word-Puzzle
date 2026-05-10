// Loads optional MP3/WAV assets from assets/sounds/ and plays them by name.
// Designed to be a graceful no-op when:
//   - expo-av isn't linked (Expo Go without the right dev client)
//   - the requested sound file doesn't exist (asset never bundled)
//   - playback fails for any reason
//
// Callers don't need to branch on availability; just call play() and it
// either makes a noise or silently does nothing.

let av: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  av = require('expo-av');
} catch {
  av = null;
}

export type SoundKind =
  | 'tick'
  | 'correct'
  | 'wrong'
  | 'bonus'
  | 'celebrate'
  | 'sparkle'
  | 'coin';

// Asset map. require() returns the asset module id at bundle time; if the
// referenced file is missing, Metro fails the build, so each entry must
// either point at a real bundled file OR be commented out / replaced with
// null. We start with everything null; drop MP3s into assets/sounds/ and
// flip the corresponding entry to a real require() to enable that sound.
//
// See assets/sounds/README.md for the expected filenames.
const ASSETS: Record<SoundKind, number | null> = {
  tick: null,
  correct: null,
  wrong: null,
  bonus: null,
  celebrate: null,
  sparkle: null,
  coin: null,
};

class SoundServiceImpl {
  private cache = new Map<SoundKind, any>();
  private warned = false;

  async preload(): Promise<void> {
    if (!av) return;
    try {
      await av.Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {
      /* ignore */
    }
  }

  async play(kind: SoundKind): Promise<void> {
    if (!av) {
      if (!this.warned) {
        this.warned = true;
        console.warn('[sound] expo-av not available; sound disabled');
      }
      return;
    }
    const asset = ASSETS[kind];
    if (asset == null) return;
    try {
      let sound = this.cache.get(kind);
      if (!sound) {
        const result = await av.Audio.Sound.createAsync(asset, {
          shouldPlay: false,
          volume: 0.7,
        });
        sound = result.sound;
        this.cache.set(kind, sound);
      }
      // Replay from start — fire-and-forget, no awaiting completion.
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      /* swallow — sound is best-effort */
    }
  }

  async unload(): Promise<void> {
    for (const sound of this.cache.values()) {
      try {
        await sound.unloadAsync();
      } catch {
        /* ignore */
      }
    }
    this.cache.clear();
  }
}

export const soundService = new SoundServiceImpl();
