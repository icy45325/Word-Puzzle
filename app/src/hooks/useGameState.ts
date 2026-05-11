import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import levelsJson from '../data/levels.json';
import { lookup, normalize } from '../utils/wordValidation';
import {
  Cell,
  LevelDef,
  LevelLayout,
  layoutLevel,
  findSlotForWord,
  isWordAlreadyFilled,
} from '../utils/gridLayout';
import { computeScore, isPerfect } from '../utils/scoring';
import { useCurrentUser, useServices } from '../services';
import { uuidv4 } from '../utils/uuid';
import { feedback } from '../utils/feedback';
import { notificationsService } from '../services/notifications/NotificationsService';

const LEVELS = (levelsJson as { levels: (LevelDef & { chapter?: number })[] }).levels;

export type SubmitOutcome =
  | {
      kind: 'answer';
      word: string;
      isBonus: false;
      slotIndex: number;
      failedCountForThisWord: number;
    }
  | { kind: 'duplicate'; word: string }
  | { kind: 'not_a_word'; word: string }
  | { kind: 'already_in_level'; word: string };

interface State {
  levelIndex: number;
  loaded: boolean;
  /** slot index → the word the player spelled to fill it */
  filledSlots: Record<number, string>;
  startedAt: number;
  hintsUsed: number;
  /** Per-slot count of failed attempts before that slot was filled. Keyed
   *  by the canonical preset word for that slot (stable across replays). */
  failedAttempts: Record<string, number>;
  revealedCells: Record<string, true>;
  lastOutcome: SubmitOutcome | null;
  levelCompleted: boolean;
}

type Action =
  | { type: 'HYDRATE'; levelIndex: number }
  | { type: 'SLOT_FILLED'; slotIndex: number; word: string; failedCount: number }
  | { type: 'FAIL'; outcome: SubmitOutcome; bumpSlots: string[] }
  | { type: 'NEUTRAL'; outcome: SubmitOutcome }
  | { type: 'REVEAL_CELL'; cellKey: string }
  | { type: 'NEXT_LEVEL'; levelIndex: number }
  | { type: 'RESET_LEVEL' }
  | { type: 'MARK_COMPLETE' };

const freshLevelState = (levelIndex: number): Omit<State, 'loaded'> => ({
  levelIndex,
  filledSlots: {},
  startedAt: Date.now(),
  hintsUsed: 0,
  failedAttempts: {},
  revealedCells: {},
  lastOutcome: null,
  levelCompleted: false,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...freshLevelState(action.levelIndex), loaded: true };
    case 'SLOT_FILLED': {
      const outcome: SubmitOutcome = {
        kind: 'answer',
        word: action.word,
        isBonus: false,
        slotIndex: action.slotIndex,
        failedCountForThisWord: action.failedCount,
      };
      return {
        ...state,
        filledSlots: { ...state.filledSlots, [action.slotIndex]: action.word },
        lastOutcome: outcome,
      };
    }
    case 'FAIL': {
      const next = { ...state.failedAttempts };
      for (const w of action.bumpSlots) {
        next[w] = (next[w] ?? 0) + 1;
      }
      return {
        ...state,
        failedAttempts: next,
        lastOutcome: action.outcome,
      };
    }
    case 'NEUTRAL':
      return { ...state, lastOutcome: action.outcome };
    case 'REVEAL_CELL':
      if (state.revealedCells[action.cellKey]) return state;
      return {
        ...state,
        revealedCells: { ...state.revealedCells, [action.cellKey]: true },
        hintsUsed: state.hintsUsed + 1,
      };
    case 'MARK_COMPLETE':
      return { ...state, levelCompleted: true };
    case 'NEXT_LEVEL':
      return { ...freshLevelState(action.levelIndex), loaded: true };
    case 'RESET_LEVEL':
      return { ...freshLevelState(state.levelIndex), loaded: true };
    default:
      return state;
  }
}

export interface RevealResult {
  ok: boolean;
  reason?: 'no_hints' | 'all_revealed';
}

export function useGameState() {
  const services = useServices();
  const user = useCurrentUser();
  const submittingComplete = useRef(false);

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...freshLevelState(0),
    loaded: false,
  }));

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) return;
      (async () => {
        const progress = await services.progress.load(user.userId);
        if (cancelled) return;
        const idx = Math.min(
          Math.max(progress.currentLevelIndex, 0),
          LEVELS.length - 1
        );
        if (!state.loaded || idx !== state.levelIndex) {
          dispatch({ type: 'HYDRATE', levelIndex: idx });
          submittingComplete.current = false;
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user, services.progress, state.loaded, state.levelIndex])
  );

  const level = LEVELS[state.levelIndex];
  const layout: LevelLayout = useMemo(() => layoutLevel(level), [level]);
  const totalAnswers = layout.slots.length;

  // foundAnswers in the legacy shape (list of filled words) for screens that
  // still iterate by word rather than by slot — chapter end, WordsFoundPanel.
  const foundAnswers = useMemo(
    () => Object.values(state.filledSlots),
    [state.filledSlots]
  );

  // Map from slot index → ordered cells, for the hint-reveal picker so it
  // can find the next-unrevealed cell of any unfilled slot.
  const slotCells = useMemo(() => {
    const map = new Map<number, Cell[]>();
    for (let i = 0; i < layout.slots.length; i++) {
      const slot = layout.slots[i];
      const cells: Cell[] = [];
      for (let p = 0; p < slot.length; p++) {
        const r = slot.dir === 'H' ? slot.row : slot.row + p;
        const c = slot.dir === 'H' ? slot.col + p : slot.col;
        const cell = layout.cells.find((cc) => cc.row === r && cc.col === c);
        if (cell) cells.push(cell);
      }
      map.set(i, cells);
    }
    return map;
  }, [layout]);

  useEffect(() => {
    if (!user || !state.loaded) return;
    services.analytics.track({ name: 'level_start', props: { levelId: level.id } });
    submittingComplete.current = false;
  }, [level.id, services, user, state.loaded]);

  const submitWord = useCallback(
    (raw: string): SubmitOutcome => {
      const word = normalize(raw);
      // Treat short / non-word submissions as misses.
      if (word.length < 2 || !lookup(word)) {
        const outcome: SubmitOutcome = { kind: 'not_a_word', word };
        // Bump the failed-attempt counter for every still-unfilled slot's
        // canonical word — the 3-fail-then-auto-open detail behavior keys
        // off this map.
        const unfilledCanonicals = layout.slots
          .map((s, i) => (state.filledSlots[i] ? null : s.word))
          .filter((w): w is string => w != null);
        dispatch({
          type: 'FAIL',
          outcome,
          bumpSlots: unfilledCanonicals,
        });
        return outcome;
      }
      // Already-filled check: if this exact word already fills a slot, no-op.
      if (isWordAlreadyFilled(state.filledSlots, word)) {
        const outcome: SubmitOutcome = { kind: 'already_in_level', word };
        dispatch({ type: 'NEUTRAL', outcome });
        return outcome;
      }
      // Find a slot that accepts this word.
      const slotIdx = findSlotForWord(layout, state.filledSlots, word);
      if (slotIdx == null) {
        // Word is in dictionary but doesn't fit any unfilled slot. Per the
        // updated rules we just silently skip — no bonus tracking, no
        // wrong feedback (so the player doesn't get punished for legit
        // anagrams that just happen not to fit).
        const outcome: SubmitOutcome = { kind: 'duplicate', word };
        dispatch({ type: 'NEUTRAL', outcome });
        return outcome;
      }
      const canonical = layout.slots[slotIdx].word;
      const failedCount = state.failedAttempts[canonical] ?? 0;
      dispatch({
        type: 'SLOT_FILLED',
        slotIndex: slotIdx,
        word,
        failedCount,
      });
      feedback('correct');
      services.analytics.track({
        name: 'word_found',
        props: { word, levelId: level.id, bonus: false },
      });
      if (user) {
        services.economy.grant(user.userId, {
          type: 'word_found',
          word,
          length: word.length,
        });
        services.learnedWords.add(user.userId, {
          word,
          levelId: level.id,
          firstFoundAt: Date.now(),
          isBonus: false,
        });
      }
      return {
        kind: 'answer',
        word,
        isBonus: false,
        slotIndex: slotIdx,
        failedCountForThisWord: failedCount,
      };
    },
    [layout, level.id, services, state.failedAttempts, state.filledSlots, user]
  );

  const revealLetter = useCallback(async (): Promise<RevealResult> => {
    if (!user) return { ok: false, reason: 'no_hints' };
    let pickedKey: string | null = null;
    for (let i = 0; i < layout.slots.length; i++) {
      if (state.filledSlots[i]) continue;
      const cells = slotCells.get(i) ?? [];
      for (const cell of cells) {
        const key = `${cell.row},${cell.col}`;
        // If this cell is already revealed (by hint or by another filled
        // slot's letters being visible), skip.
        const alreadyByOtherSlot = cell.slotIndexes.some(
          (sIdx) => state.filledSlots[sIdx]
        );
        if (alreadyByOtherSlot) continue;
        if (state.revealedCells[key]) continue;
        pickedKey = key;
        break;
      }
      if (pickedKey) break;
    }
    if (!pickedKey) return { ok: false, reason: 'all_revealed' };
    const result = await services.economy.spend(user.userId, 'hint', 1);
    if (!result.ok) return { ok: false, reason: 'no_hints' };
    dispatch({ type: 'REVEAL_CELL', cellKey: pickedKey });
    feedback('sparkle');
    services.analytics.track({
      name: 'hint_used',
      props: { levelId: level.id, kind: 'reveal_letter' },
    });
    return { ok: true };
  }, [layout, level.id, services, slotCells, state.filledSlots, state.revealedCells, user]);

  // Persist progress + run side effects on level complete.
  useEffect(() => {
    if (submittingComplete.current) return;
    if (!state.loaded) return;
    if (Object.keys(state.filledSlots).length !== totalAnswers) return;
    submittingComplete.current = true;
    const timeMs = Date.now() - state.startedAt;
    const scoreInput = {
      wordsFound: totalAnswers,
      totalWords: totalAnswers,
      timeMs,
      hintsUsed: state.hintsUsed,
    };
    const score = computeScore(scoreInput);
    const perfect = isPerfect(scoreInput);
    services.analytics.track({
      name: 'level_complete',
      props: { levelId: level.id, score, timeMs },
    });
    feedback('celebrate');
    if (user) {
      const completedIdx = state.levelIndex;
      services.economy.grant(user.userId, {
        type: 'level_complete',
        levelId: level.id,
        perfect,
      });
      services.leaderboard.submit({
        scoreId: uuidv4(),
        userId: user.userId,
        levelId: level.id,
        score,
        wordsFound: totalAnswers,
        totalWords: totalAnswers,
        timeMs,
        hintsUsed: state.hintsUsed,
        clientTs: Date.now(),
        schemaVersion: 1,
      });
      (async () => {
        const prev = await services.progress.load(user.userId);
        const newFurthest = Math.max(
          prev.furthestLevelIndex,
          Math.min(completedIdx + 1, LEVELS.length - 1)
        );
        const completedIds = prev.completedLevelIds.includes(level.id)
          ? prev.completedLevelIds
          : [...prev.completedLevelIds, level.id];
        await services.progress.save({
          ...prev,
          currentLevelIndex: Math.min(completedIdx + 1, LEVELS.length - 1),
          furthestLevelIndex: newFurthest,
          completedLevelIds: completedIds,
          foundWordsByLevel: {
            ...prev.foundWordsByLevel,
            [level.id]: Object.values(state.filledSlots),
          },
        });
        // Re-arm tomorrow's review reminder based on how many SR-due
        // words the player will have when they wake up. We schedule
        // based on current due count; the reminder fires only if
        // dueCount > 0, otherwise it's silently skipped.
        const due = await services.learnedWords.getDue(user.userId);
        notificationsService.scheduleReviewDue(due.length);
      })();
    }
    dispatch({ type: 'MARK_COMPLETE' });
  }, [
    level.id,
    services,
    state.filledSlots,
    state.hintsUsed,
    state.levelIndex,
    state.loaded,
    state.startedAt,
    totalAnswers,
    user,
  ]);

  const nextLevel = useCallback(() => {
    const next = Math.min(state.levelIndex + 1, LEVELS.length - 1);
    dispatch({ type: 'NEXT_LEVEL', levelIndex: next });
  }, [state.levelIndex]);

  const claimChapterReward = useCallback(async () => {
    if (!user) return null;
    const chapterSize = services.remoteConfig.getNumber('chapter.size', 10);
    const chapterIdx = Math.floor(state.levelIndex / chapterSize) + 1;
    const rewardCoins = services.remoteConfig.getNumber('chapter.rewardCoins', 100);
    const hintCapLevel = services.remoteConfig.getNumber('chapter.hintCapLevel', 50);
    const baseHints = services.remoteConfig.getNumber('chapter.hintsGranted', 3);
    const grantedHints = state.levelIndex + 1 <= hintCapLevel ? baseHints : 0;

    await services.economy.grantChapterReward(user.userId, {
      chapter: chapterIdx,
      coins: rewardCoins,
      hints: grantedHints,
    });
    const prev = await services.progress.load(user.userId);
    if (!prev.chapterRewardsClaimed.includes(chapterIdx)) {
      await services.progress.save({
        ...prev,
        chapterRewardsClaimed: [...prev.chapterRewardsClaimed, chapterIdx],
      });
    }
    services.analytics.track({
      name: 'level_complete',
      props: {
        levelId: `chapter_${chapterIdx}`,
        score: rewardCoins,
        timeMs: 0,
      },
    });
    return { chapter: chapterIdx, coins: rewardCoins, hints: grantedHints };
  }, [services, state.levelIndex, user]);

  const resetLevel = useCallback(() => dispatch({ type: 'RESET_LEVEL' }), []);

  const chapterSize = services.remoteConfig.getNumber('chapter.size', 10);
  const isChapterEnd =
    state.levelCompleted &&
    (state.levelIndex + 1) % chapterSize === 0;

  return {
    level,
    layout,
    filledSlots: state.filledSlots,
    foundAnswers,
    // Kept as empty array for backward compat with screens that still
    // destructure `bonusWords`; the new rules drop bonus tracking.
    bonusWords: [] as string[],
    lastOutcome: state.lastOutcome,
    levelCompleted: state.levelCompleted,
    isChapterEnd,
    chapterIndex: Math.floor(state.levelIndex / chapterSize) + 1,
    totalAnswers,
    hintsUsed: state.hintsUsed,
    revealedCells: state.revealedCells,
    failedAttempts: state.failedAttempts,
    submitWord,
    revealLetter,
    nextLevel,
    resetLevel,
    claimChapterReward,
    wordDetail: (word: string) => lookup(word),
    isLastLevel: state.levelIndex >= LEVELS.length - 1,
  };
}
