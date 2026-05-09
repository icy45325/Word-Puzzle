import type { LearnedWord, LearnedWordsRepo, Uuid } from '../types';
import {
  keys,
  moveKey,
  readJson,
  removeKey,
  writeJson,
} from '../../store/storage';
import {
  applyMasteryDelta,
  applyReview,
  nextDueAt,
} from '../../utils/spacedRepetition';

function hydrate(entry: LearnedWord): Required<LearnedWord> {
  // Lazy-migrate legacy v0 entries (which lacked mastery fields) so the
  // rest of the app can read .masteryLevel etc. without optional chains.
  return {
    word: entry.word,
    levelId: entry.levelId,
    firstFoundAt: entry.firstFoundAt,
    isBonus: entry.isBonus,
    masteryLevel: entry.masteryLevel ?? 0,
    lastReviewedAt: entry.lastReviewedAt ?? 0,
    nextReviewDue:
      entry.nextReviewDue ?? nextDueAt(entry.masteryLevel ?? 0, entry.firstFoundAt),
    reviewCount: entry.reviewCount ?? 0,
    correctStreak: entry.correctStreak ?? 0,
  };
}

export class LocalLearnedWordsRepo implements LearnedWordsRepo {
  async list(userId: Uuid): Promise<LearnedWord[]> {
    const raw = (await readJson<LearnedWord[]>(keys.learnedWords(userId))) ?? [];
    return raw.map(hydrate);
  }

  async add(userId: Uuid, entry: LearnedWord): Promise<void> {
    const existing = await this.list(userId);
    const word = entry.word.toUpperCase();
    if (existing.some((e) => e.word.toUpperCase() === word)) return;
    const fresh = hydrate({ ...entry, word });
    // First encounter: due now (mastery 0 → interval 0).
    fresh.nextReviewDue = entry.firstFoundAt;
    const next = [...existing, fresh];
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
    const seen = new Map<string, LearnedWord>();
    for (const e of target) seen.set(e.word.toUpperCase(), hydrate(e));
    for (const incomingEntry of incoming) {
      const w = incomingEntry.word.toUpperCase();
      const existing = seen.get(w);
      const hydratedIncoming = hydrate({ ...incomingEntry, word: w });
      if (!existing) {
        seen.set(w, hydratedIncoming);
        continue;
      }
      // Merge by keeping the higher mastery + earlier firstFoundAt + later
      // lastReviewedAt + summed reviewCount.
      seen.set(w, {
        ...existing,
        masteryLevel: Math.max(existing.masteryLevel ?? 0, hydratedIncoming.masteryLevel),
        firstFoundAt: Math.min(existing.firstFoundAt, hydratedIncoming.firstFoundAt),
        lastReviewedAt: Math.max(
          existing.lastReviewedAt ?? 0,
          hydratedIncoming.lastReviewedAt
        ),
        nextReviewDue: Math.max(
          existing.nextReviewDue ?? 0,
          hydratedIncoming.nextReviewDue
        ),
        reviewCount: (existing.reviewCount ?? 0) + (hydratedIncoming.reviewCount ?? 0),
        correctStreak: Math.max(
          existing.correctStreak ?? 0,
          hydratedIncoming.correctStreak ?? 0
        ),
      });
    }
    await writeJson(toKey, [...seen.values()]);
    await removeKey(fromKey);
  }

  async clear(userId: Uuid): Promise<void> {
    await removeKey(keys.learnedWords(userId));
  }

  async applyReviewResult(
    userId: Uuid,
    word: string,
    correct: boolean
  ): Promise<LearnedWord | null> {
    return this.update(userId, word, (entry) => ({
      ...entry,
      ...applyReview(entry, correct),
    }));
  }

  async setMastery(
    userId: Uuid,
    word: string,
    delta: 1 | -1
  ): Promise<LearnedWord | null> {
    return this.update(userId, word, (entry) => ({
      ...entry,
      ...applyMasteryDelta(entry, delta),
    }));
  }

  async getDue(userId: Uuid, now: number = Date.now()): Promise<LearnedWord[]> {
    const all = await this.list(userId);
    return all
      .filter((e) => (e.nextReviewDue ?? 0) <= now)
      .sort((a, b) => (a.nextReviewDue ?? 0) - (b.nextReviewDue ?? 0));
  }

  private async update(
    userId: Uuid,
    word: string,
    mutator: (entry: Required<LearnedWord>) => LearnedWord
  ): Promise<LearnedWord | null> {
    const all = await this.list(userId);
    const target = word.toUpperCase();
    const idx = all.findIndex((e) => e.word.toUpperCase() === target);
    if (idx === -1) return null;
    const updated = mutator(hydrate(all[idx]));
    const next = [...all];
    next[idx] = updated;
    await writeJson(keys.learnedWords(userId), next);
    return updated;
  }
}
