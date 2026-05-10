import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import levelsJson from '../data/levels.json';
import { isInDictionary, lookup, normalize } from '../utils/wordValidation';
import { Cell, LevelDef, LevelLayout, layoutLevel } from '../utils/gridLayout';
import { computeScore, isPerfect } from '../utils/scoring';
import { useCurrentUser, useServices } from '../services';
import { uuidv4 } from '../utils/uuid';

const LEVELS = (levelsJson as { levels: (LevelDef & { chapter?: number })[] }).levels;

export type SubmitOutcome =
  | { kind: 'answer'; word: string; isBonus: false; failedCountForThisWord: number }
  | { kind: 'bonus'; word: string; isBonus: true }
  | { kind: 'duplicate'; word: string }
  | { kind: 'not_a_word'; word: string }
  | { kind: 'already_in_level'; word: string };

interface State {
  levelIndex: number;
  loaded: boolean;
  foundAnswers: string[];
  bonusWords: string[];
  startedAt: number;
  hintsUsed: number;
  failedAttempts: Record<string, number>;
  revealedCells: Record<string, true>;
  lastOutcome: SubmitOutcome | null;
  levelCompleted: boolean;
}

type Action =
  | { type: 'HYDRATE'; levelIndex: number }
  | { type: 'ANSWER_FOUND'; word: string; failedCount: number }
  | { type: 'BONUS_FOUND'; word: string }
  | { type: 'FAIL'; outcome: SubmitOutcome; undiscoveredTargets: string[] }
  | { type: 'NEUTRAL'; outcome: SubmitOutcome }
  | { type: 'REVEAL_CELL'; cellKey: string }
  | { type: 'NEXT_LEVEL'; levelIndex: number }
  | { type: 'RESET_LEVEL' }
  | { type: 'MARK_COMPLETE' };

const freshLevelState = (levelIndex: number): Omit<State, 'loaded'> => ({
  levelIndex,
  foundAnswers: [],
  bonusWords: [],
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
    case 'ANSWER_FOUND': {
      const outcome: SubmitOutcome = {
        kind: 'answer',
        word: action.word,
        isBonus: false,
        failedCountForThisWord: action.failedCount,
      };
      return {
        ...state,
        foundAnswers: [...state.foundAnswers, action.word],
        lastOutcome: outcome,
      };
    }
    case 'BONUS_FOUND': {
      const outcome: SubmitOutcome = {
        kind: 'bonus',
        word: action.word,
        isBonus: true,
      };
      return {
        ...state,
        bonusWords: [...state.bonusWords, action.word],
        lastOutcome: outcome,
      };
    }
    case 'FAIL': {
      const next = { ...state.failedAttempts };
      for (const w of action.undiscoveredTargets) {
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

  // Hydrate from persisted progress every time the screen gains focus.
  // This way picking a different level on the Map and popping back here
  // (without replace()) still re-loads to the picked level — the existing
  // GameScreen instance gets re-hydrated rather than showing stale state.
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
  const totalAnswers = layout.answerWords.length;

  // Build word→cells (ordered) lookup so revealLetter can pick the next
  // unrevealed cell deterministically.
  const wordCells = useMemo(() => {
    const map = new Map<string, Cell[]>();
    for (const ans of level.answers) {
      const w = ans.word.toUpperCase();
      const cells: Cell[] = [];
      for (let i = 0; i < w.length; i++) {
        const r = ans.dir === 'H' ? ans.row : ans.row + i;
        const c = ans.dir === 'H' ? ans.col + i : ans.col;
        const cell = layout.cells.find((cc) => cc.row === r && cc.col === c);
        if (cell) cells.push(cell);
      }
      map.set(w, cells);
    }
    return map;
  }, [layout, level]);

  useEffect(() => {
    if (!user || !state.loaded) return;
    services.analytics.track({ name: 'level_start', props: { levelId: level.id } });
    submittingComplete.current = false;
  }, [level.id, services, user, state.loaded]);

  const submitWord = useCallback(
    (raw: string): SubmitOutcome => {
      const word = normalize(raw);
      if (word.length < 2) {
        const outcome: SubmitOutcome = { kind: 'not_a_word', word };
        const undiscovered = layout.answerWords.filter(
          (w) => !state.foundAnswers.includes(w)
        );
        dispatch({ type: 'FAIL', outcome, undiscoveredTargets: undiscovered });
        return outcome;
      }
      const isAnswer = layout.answerWords.includes(word);
      if (isAnswer) {
        if (state.foundAnswers.includes(word)) {
          const outcome: SubmitOutcome = { kind: 'already_in_level', word };
          const undiscovered = layout.answerWords.filter(
            (w) => !state.foundAnswers.includes(w)
          );
          dispatch({ type: 'FAIL', outcome, undiscoveredTargets: undiscovered });
          return outcome;
        }
        const failedCount = state.failedAttempts[word] ?? 0;
        dispatch({ type: 'ANSWER_FOUND', word, failedCount });
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
          failedCountForThisWord: failedCount,
        };
      }
      if (isInDictionary(word)) {
        if (state.bonusWords.includes(word)) {
          const outcome: SubmitOutcome = { kind: 'duplicate', word };
          dispatch({ type: 'NEUTRAL', outcome });
          return outcome;
        }
        const outcome: SubmitOutcome = { kind: 'bonus', word, isBonus: true };
        dispatch({ type: 'BONUS_FOUND', word });
        services.analytics.track({
          name: 'word_found',
          props: { word, levelId: level.id, bonus: true },
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
            isBonus: true,
          });
        }
        return outcome;
      }
      const outcome: SubmitOutcome = { kind: 'not_a_word', word };
      const undiscovered = layout.answerWords.filter(
        (w) => !state.foundAnswers.includes(w)
      );
      dispatch({ type: 'FAIL', outcome, undiscoveredTargets: undiscovered });
      return outcome;
    },
    [layout, level.id, services, state.bonusWords, state.foundAnswers, state.failedAttempts, user]
  );

  const revealLetter = useCallback(async (): Promise<RevealResult> => {
    if (!user) return { ok: false, reason: 'no_hints' };
    const undiscovered = layout.answerWords.filter(
      (w) => !state.foundAnswers.includes(w)
    );
    let pickedKey: string | null = null;
    for (const word of undiscovered) {
      const cells = wordCells.get(word) ?? [];
      for (const cell of cells) {
        const key = `${cell.row},${cell.col}`;
        const alreadyRevealedByFound = cell.answerWords.some((w) =>
          state.foundAnswers.includes(w)
        );
        if (alreadyRevealedByFound) continue;
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
    services.analytics.track({
      name: 'hint_used',
      props: { levelId: level.id, kind: 'reveal_letter' },
    });
    return { ok: true };
  }, [layout, level.id, services, state.foundAnswers, state.revealedCells, user, wordCells]);

  // Persist progress + run side effects on level complete.
  useEffect(() => {
    if (submittingComplete.current) return;
    if (!state.loaded) return;
    if (state.foundAnswers.length !== totalAnswers) return;
    submittingComplete.current = true;
    const timeMs = Date.now() - state.startedAt;
    const scoreInput = {
      wordsFound: state.foundAnswers.length,
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
        wordsFound: scoreInput.wordsFound,
        totalWords: totalAnswers,
        timeMs,
        hintsUsed: state.hintsUsed,
        clientTs: Date.now(),
        schemaVersion: 1,
      });
      // Persist progress: bump furthestLevelIndex past the level just cleared.
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
            [level.id]: [...state.foundAnswers, ...state.bonusWords],
          },
        });
      })();
    }
    dispatch({ type: 'MARK_COMPLETE' });
  }, [
    level.id,
    services,
    state.bonusWords,
    state.foundAnswers,
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
    foundAnswers: state.foundAnswers,
    bonusWords: state.bonusWords,
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
