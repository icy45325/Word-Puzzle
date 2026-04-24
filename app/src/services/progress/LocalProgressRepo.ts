import type { ProgressRepo, ProgressState, Uuid } from '../types';
import {
  CURRENT_SCHEMA_VERSION,
  keys,
  moveKey,
  readJson,
  removeKey,
  writeJson,
} from '../../store/storage';

const empty = (userId: Uuid): ProgressState => ({
  userId,
  currentLevelIndex: 0,
  completedLevelIds: [],
  foundWordsByLevel: {},
  schemaVersion: CURRENT_SCHEMA_VERSION,
});

export class LocalProgressRepo implements ProgressRepo {
  async load(userId: Uuid): Promise<ProgressState> {
    const existing = await readJson<ProgressState>(keys.progress(userId));
    if (!existing) return empty(userId);
    // Room for lazy schema migration once schemaVersion bumps.
    return { ...empty(userId), ...existing, userId };
  }

  async save(state: ProgressState): Promise<void> {
    await writeJson(keys.progress(state.userId), {
      ...state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }

  async migrate(fromUserId: Uuid, toUserId: Uuid): Promise<void> {
    await moveKey(keys.progress(fromUserId), keys.progress(toUserId));
    await moveKey(keys.economy(fromUserId), keys.economy(toUserId));
    await moveKey(keys.scores(fromUserId), keys.scores(toUserId));
  }

  async reset(userId: Uuid): Promise<void> {
    await removeKey(keys.progress(userId));
  }
}
