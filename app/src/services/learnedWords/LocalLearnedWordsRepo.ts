import type { LearnedWord, LearnedWordsRepo, Uuid } from '../types';
import { keys, moveKey, readJson, removeKey, writeJson } from '../../store/storage';

export class LocalLearnedWordsRepo implements LearnedWordsRepo {
  async list(userId: Uuid): Promise<LearnedWord[]> {
    return (await readJson<LearnedWord[]>(keys.learnedWords(userId))) ?? [];
  }

  async add(userId: Uuid, entry: LearnedWord): Promise<void> {
    const existing = await this.list(userId);
    const word = entry.word.toUpperCase();
    if (existing.some((e) => e.word.toUpperCase() === word)) return;
    const next = [...existing, { ...entry, word }];
    await writeJson(keys.learnedWords(userId), next);
  }

  async migrate(fromUserId: Uuid, toUserId: Uuid): Promise<void> {
    const fromKey = keys.learnedWords(fromUserId);
    const toKey = keys.learnedWords(toUserId);
    const incoming = (await readJson<LearnedWord[]>(fromKey)) ?? [];
    if (incoming.length === 0) {
      await moveKey(fromKey, toKey);
      return;
    }
    const target = (await readJson<LearnedWord[]>(toKey)) ?? [];
    const seen = new Set(target.map((e) => e.word.toUpperCase()));
    for (const entry of incoming) {
      const w = entry.word.toUpperCase();
      if (seen.has(w)) continue;
      target.push({ ...entry, word: w });
      seen.add(w);
    }
    await writeJson(toKey, target);
    await removeKey(fromKey);
  }

  async clear(userId: Uuid): Promise<void> {
    await removeKey(keys.learnedWords(userId));
  }
}
