import type { AuthService, User } from '../types';
import { keys, readJson, writeJson } from '../../store/storage';
import { uuidv4 } from '../../utils/uuid';

export class AnonymousAuth implements AuthService {
  private cached: User | null = null;
  private listeners = new Set<(u: User) => void>();

  async getCurrentUser(): Promise<User> {
    if (this.cached) return this.cached;
    const existing = await readJson<User>(keys.user());
    if (existing && existing.userId) {
      this.cached = existing;
      return existing;
    }
    const fresh: User = {
      userId: uuidv4(),
      displayName: '游客' + Math.floor(1000 + Math.random() * 9000),
      isAnonymous: true,
      createdAt: Date.now(),
    };
    await writeJson(keys.user(), fresh);
    this.cached = fresh;
    return fresh;
  }

  async link(): Promise<User> {
    // Real provider linking not implemented in MVP. When we plug in
    // Firebase/Supabase/Apple, call services.progress.migrate(oldId, newId)
    // from here before flipping the cached user.
    throw new Error('AuthService.link: not implemented in MVP');
  }

  async signOut(): Promise<void> {
    // Anonymous users don't sign out in the traditional sense; this is a
    // no-op placeholder that keeps UI code simple.
  }

  onChange(listener: (user: User) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
