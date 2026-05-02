import type { AuthService, LearnedWordsRepo, ProgressRepo, User } from '../types';
import { keys, readJson, writeJson } from '../../store/storage';
import { uuidv4 } from '../../utils/uuid';

export interface LinkedIdentity {
  userId: string;
  displayName: string;
}

export class AnonymousAuth implements AuthService {
  private cached: User | null = null;
  private listeners = new Set<(u: User) => void>();

  constructor(
    private readonly progress: ProgressRepo,
    private readonly learnedWords: LearnedWordsRepo
  ) {}

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
    throw new Error('AuthService.link: use linkWithIdentity for v2 sign-in flow');
  }

  // Step-7 (Google sign-in) call site: pass the resolved Google identity in,
  // we migrate local data and flip the cached user.
  async linkWithIdentity(identity: LinkedIdentity): Promise<User> {
    const current = await this.getCurrentUser();
    if (!current.isAnonymous) return current;
    if (current.userId !== identity.userId) {
      await this.progress.migrate(current.userId, identity.userId);
      await this.learnedWords.migrate(current.userId, identity.userId);
    }
    const next: User = {
      userId: identity.userId,
      displayName: identity.displayName,
      isAnonymous: false,
      createdAt: current.createdAt,
    };
    await writeJson(keys.user(), next);
    this.cached = next;
    this.listeners.forEach((fn) => fn(next));
    return next;
  }

  async signOut(): Promise<void> {
    // Anonymous users don't sign out. After Google sign-in this resets to a
    // fresh guest identity so the next launch starts clean.
    this.cached = null;
    await writeJson(keys.user(), null as unknown as User);
  }

  onChange(listener: (user: User) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
