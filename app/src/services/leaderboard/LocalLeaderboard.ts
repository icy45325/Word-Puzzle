import type {
  LeaderboardScope,
  LeaderboardService,
  ScoreRecord,
} from '../types';
import { keys, readJson, writeJson } from '../../store/storage';

const MAX_KEEP = 200;

export class LocalLeaderboard implements LeaderboardService {
  async submit(record: ScoreRecord): Promise<void> {
    const key = keys.scores(record.userId);
    const existing = (await readJson<ScoreRecord[]>(key)) ?? [];
    const next = [record, ...existing].slice(0, MAX_KEEP);
    await writeJson(key, next);
  }

  async getTop(scope: LeaderboardScope, n: number): Promise<ScoreRecord[]> {
    if (scope !== 'self') {
      // Friends and global scopes require a backend; MVP returns empty
      // so the UI can already branch on these scopes without special-casing.
      return [];
    }
    // Without a userId we can't key into storage. Callers that need their
    // own board should use getPersonalBest or pass userId in a future iteration.
    return [];
  }

  async getPersonalBest(_levelId: string): Promise<ScoreRecord | null> {
    return null;
  }
}
