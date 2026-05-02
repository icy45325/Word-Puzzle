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
  furthestLevelIndex: 0,
  completedLevelIds: [],
  foundWordsByLevel: {},
  chapterRewardsClaimed: [],
  schemaVersion: CURRENT_SCHEMA_VERSION,
});

type LegacyV1 = Partial<ProgressState> & {
  schemaVersion?: number;
  currentLevelIndex?: number;
};

function migrate(raw: LegacyV1, userId: Uuid): ProgressState {
  const base = empty(userId);
  const currentLevelIndex = raw.currentLevelIndex ?? 0;
  return {
    ...base,
    ...raw,
    userId,
    currentLevelIndex,
    furthestLevelIndex:
      raw.furthestLevelIndex ?? Math.max(currentLevelIndex, 0),
    chapterRewardsClaimed: raw.chapterRewardsClaimed ?? [],
    completedLevelIds: raw.completedLevelIds ?? [],
    foundWordsByLevel: raw.foundWordsByLevel ?? {},
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export class LocalProgressRepo implements ProgressRepo {
  async load(userId: Uuid): Promise<ProgressState> {
    const existing = await readJson<LegacyV1>(keys.progress(userId));
    if (!existing) return empty(userId);
    return migrate(existing, userId);
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
    await moveKey(keys.friends(fromUserId), keys.friends(toUserId));
  }

  async reset(userId: Uuid): Promise<void> {
    await removeKey(keys.progress(userId));
  }
}
