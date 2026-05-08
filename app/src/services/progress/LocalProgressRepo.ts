import type {
  EconomyState,
  Friend,
  ProgressRepo,
  ProgressState,
  ScoreRecord,
  Uuid,
} from '../types';
import {
  CURRENT_SCHEMA_VERSION,
  keys,
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

function migrateSchema(raw: LegacyV1, userId: Uuid): ProgressState {
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

const SCORES_MAX_KEEP = 200;

function mergeProgress(
  a: ProgressState | null,
  b: ProgressState | null,
  userId: Uuid
): ProgressState | null {
  if (!a && !b) return null;
  if (!a) return { ...b!, userId, schemaVersion: CURRENT_SCHEMA_VERSION };
  if (!b) return { ...a, userId, schemaVersion: CURRENT_SCHEMA_VERSION };
  const completedSet = new Set([...a.completedLevelIds, ...b.completedLevelIds]);
  const claimedSet = new Set([...a.chapterRewardsClaimed, ...b.chapterRewardsClaimed]);
  const foundMerged: Record<string, string[]> = { ...a.foundWordsByLevel };
  for (const [levelId, words] of Object.entries(b.foundWordsByLevel)) {
    const seen = new Set([...(foundMerged[levelId] ?? []), ...words]);
    foundMerged[levelId] = [...seen];
  }
  return {
    userId,
    currentLevelIndex: Math.max(a.currentLevelIndex, b.currentLevelIndex),
    furthestLevelIndex: Math.max(a.furthestLevelIndex, b.furthestLevelIndex),
    completedLevelIds: [...completedSet],
    foundWordsByLevel: foundMerged,
    chapterRewardsClaimed: [...claimedSet].sort((x, y) => x - y),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

function mergeEconomy(
  a: EconomyState | null,
  b: EconomyState | null,
  userId: Uuid
): EconomyState | null {
  if (!a && !b) return null;
  if (!a) return { ...b!, userId, schemaVersion: CURRENT_SCHEMA_VERSION };
  if (!b) return { ...a, userId, schemaVersion: CURRENT_SCHEMA_VERSION };
  const lastA = a.lastCheckInTs ?? 0;
  const lastB = b.lastCheckInTs ?? 0;
  const lastMax = Math.max(lastA, lastB);
  return {
    userId,
    coins: a.coins + b.coins,
    hints: a.hints + b.hints,
    streakDays: Math.max(a.streakDays, b.streakDays),
    lastCheckInTs: lastMax > 0 ? lastMax : null,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

function mergeScores(
  a: ScoreRecord[] | null,
  b: ScoreRecord[] | null
): ScoreRecord[] | null {
  if (!a && !b) return null;
  const all = [...(a ?? []), ...(b ?? [])];
  // de-dupe by scoreId, keep most recent of each
  const byId = new Map<string, ScoreRecord>();
  for (const s of all) {
    const existing = byId.get(s.scoreId);
    if (!existing || existing.clientTs < s.clientTs) byId.set(s.scoreId, s);
  }
  return [...byId.values()]
    .sort((x, y) => y.clientTs - x.clientTs)
    .slice(0, SCORES_MAX_KEEP);
}

function mergeFriends(
  a: Friend[] | null,
  b: Friend[] | null
): Friend[] | null {
  if (!a && !b) return null;
  const byId = new Map<Uuid, Friend>();
  for (const f of [...(a ?? []), ...(b ?? [])]) {
    const existing = byId.get(f.userId);
    if (!existing || existing.addedAt < f.addedAt) byId.set(f.userId, f);
  }
  return [...byId.values()].sort((x, y) => y.addedAt - x.addedAt);
}

async function readWriteMerge<T>(
  fromKey: string,
  toKey: string,
  merge: (a: T | null, b: T | null) => T | null
): Promise<void> {
  const a = await readJson<T>(fromKey);
  const b = await readJson<T>(toKey);
  if (a === null && b === null) return;
  const merged = merge(a, b);
  if (merged !== null) await writeJson(toKey, merged);
  await removeKey(fromKey);
}

export class LocalProgressRepo implements ProgressRepo {
  async load(userId: Uuid): Promise<ProgressState> {
    const existing = await readJson<LegacyV1>(keys.progress(userId));
    if (!existing) return empty(userId);
    return migrateSchema(existing, userId);
  }

  async save(state: ProgressState): Promise<void> {
    await writeJson(keys.progress(state.userId), {
      ...state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }

  async migrate(fromUserId: Uuid, toUserId: Uuid): Promise<void> {
    if (fromUserId === toUserId) return;
    await readWriteMerge<ProgressState>(
      keys.progress(fromUserId),
      keys.progress(toUserId),
      (a, b) => mergeProgress(a, b, toUserId)
    );
    await readWriteMerge<EconomyState>(
      keys.economy(fromUserId),
      keys.economy(toUserId),
      (a, b) => mergeEconomy(a, b, toUserId)
    );
    await readWriteMerge<ScoreRecord[]>(
      keys.scores(fromUserId),
      keys.scores(toUserId),
      mergeScores
    );
    await readWriteMerge<Friend[]>(
      keys.friends(fromUserId),
      keys.friends(toUserId),
      mergeFriends
    );
  }

  async reset(userId: Uuid): Promise<void> {
    await removeKey(keys.progress(userId));
  }
}
