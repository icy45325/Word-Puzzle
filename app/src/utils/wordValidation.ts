import dictionary from '../data/dictionary.json';

export type DictionaryEntry = {
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  exampleCn: string;
  extra?: string;
};

const dict = dictionary as Record<string, DictionaryEntry>;

export function normalize(word: string): string {
  return word.trim().toUpperCase();
}

export function isInDictionary(word: string): boolean {
  return normalize(word) in dict;
}

export function lookup(word: string): DictionaryEntry | null {
  return dict[normalize(word)] ?? null;
}

export function canFormFromLetters(word: string, letters: string[]): boolean {
  const pool = letters.map((l) => l.toUpperCase());
  const chars = normalize(word).split('');
  const bag = [...pool];
  for (const c of chars) {
    const idx = bag.indexOf(c);
    if (idx === -1) return false;
    bag.splice(idx, 1);
  }
  return true;
}
