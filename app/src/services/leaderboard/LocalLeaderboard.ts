import type {
  Friend,
  LeaderboardScope,
  LeaderboardService,
  ScoreRecord,
  Uuid,
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

  async getTop(scope: LeaderboardScope, _n: number): Promise<ScoreRecord[]> {
    if (scope !== 'self') {
      // Friends and global scopes require a backend; the local impl returns
      // empty so the UI can already branch on these scopes without crashing.
      return [];
    }
    return [];
  }

  async getPersonalBest(_levelId: string): Promise<ScoreRecord | null> {
    return null;
  }

  myFriendCode(userId: Uuid): string {
    return userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  }

  async listFriends(userId: Uuid): Promise<Friend[]> {
    return (await readJson<Friend[]>(keys.friends(userId))) ?? [];
  }

  async addFriend(
    _userId: Uuid,
    _code: string
  ): Promise<{ ok: boolean; reason?: string }> {
    return { ok: false, reason: 'feature_pending_backend' };
  }

  async removeFriend(userId: Uuid, friendUserId: Uuid): Promise<void> {
    const list = await this.listFriends(userId);
    const next = list.filter((f) => f.userId !== friendUserId);
    await writeJson(keys.friends(userId), next);
  }
}
