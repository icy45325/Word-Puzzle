import * as Speech from 'expo-speech';

export function speak(word: string, language: string = 'en-US'): void {
  try {
    Speech.stop();
    Speech.speak(word, { language, rate: 0.9 });
  } catch {
    // Speech is best-effort; silently ignore on platforms without TTS.
  }
}
