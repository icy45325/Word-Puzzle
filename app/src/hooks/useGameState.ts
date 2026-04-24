import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import levelsJson from '../data/levels.json';
import { isInDictionary, lookup, normalize } from '../utils/wordValidation';
import { LevelDef, LevelLayout, layoutLevel } from '../utils/gridLayout';
import { computeScore, isPerfect } from '../utils/scoring';
import { useCurrentUser, useServices } from '../services';
import { uuidv4 } from '../utils/uuid';

const LEVELS = (levelsJson as { levels: LevelDef[] }).levels;

export type SubmitOutcome =
  | { kind: 'answer'; word: string; isBonus: false }
  | { kind: 'bonus'; word: string; isBonus: true }
  | { kind: 'duplicate'; word: string }
  | { kind: 'not_a_word'; word: string }
  | { kind: 'already_in_level'; word: string };

interface State {
  levelIndex: number;
  foundAnswers: string[];
  bonusWords: string[];
  startedAt: number;
  hintsUsed: number;
  lastOutcome: SubmitOutcome | null;
  levelCompleted: boolean;
}

type Action =
  | { type: 'SUBMIT_RESULT'; outcome: SubmitOutcome }
  | { type: 'USE_HINT' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'RESET_LEVEL' }
  | { type: 'MARK_COMPLETE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT_RESULT': {
      const { outcome } = action;
      if (outcome.kind === 'answer') {
        return {
          ...state,
          foundAnswers: [...state.foundAnswers, outcome.word],
          lastOutcome: outcome,
        };
      }
      if (outcome.kind === 'bonus') {
        return {
          ...state,
          bonusWords: [...state.bonusWords, outcome.word],
          lastOutcome: outcome,
        };
      }
      return { ...state, lastOutcome: outcome };
    }
    case 'USE_HINT':
      return { ...state, hintsUsed: state.hintsUsed + 1 };
    case 'MARK_COMPLETE':
      return { ...state, levelCompleted: true };
    case 'NEXT_LEVEL':
      return {
        levelIndex: (state.levelIndex + 1) % LEVELS.length,
        foundAnswers: [],
        bonusWords: [],
        startedAt: Date.now(),
        hintsUsed: 0,
        lastOutcome: null,
        levelCompleted: false,
      };
    case 'RESET_LEVEL':
      return {
        ...state,
        foundAnswers: [],
        bonusWords: [],
        startedAt: Date.now(),
        hintsUsed: 0,
        lastOutcome: null,
        levelCompleted: false,
      };
    default:
      return state;
  }
}

export function useGameState() {
  const services = useServices();
  const user = useCurrentUser();
  const submittingComplete = useRef(false);

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    levelIndex: 0,
    foundAnswers: [],
    bonusWords: [],
    startedAt: Date.now(),
    hintsUsed: 0,
    lastOutcome: null,
    levelCompleted: false,
  }));

  const level = LEVELS[state.levelIndex];
  const layout: LevelLayout = useMemo(() => layoutLevel(level), [level]);
  const totalAnswers = layout.answerWords.length;

  useEffect(() => {
    if (!user) return;
    services.analytics.track({ name: 'level_start', props: { levelId: level.id } });
    submittingComplete.current = false;
  }, [level.id, services, user]);

  const submitWord = useCallback(
    (raw: string): SubmitOutcome => {
      const word = normalize(raw);
      if (word.length < 2) {
        const outcome: SubmitOutcome = { kind: 'not_a_word', word };
        dispatch({ type: 'SUBMIT_RESULT', outcome });
        return outcome;
      }
      const isAnswer = layout.answerWords.includes(word);
      if (isAnswer) {
        if (state.foundAnswers.includes(word)) {
          const outcome: SubmitOutcome = { kind: 'already_in_level', word };
          dispatch({ type: 'SUBMIT_RESULT', outcome });
          return outcome;
        }
        const outcome: SubmitOutcome = { kind: 'answer', word, isBonus: false };
        dispatch({ type: 'SUBMIT_RESULT', outcome });
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
        }
        return outcome;
      }
      if (isInDictionary(word)) {
        if (state.bonusWords.includes(word)) {
          const outcome: SubmitOutcome = { kind: 'duplicate', word };
          dispatch({ type: 'SUBMIT_RESULT', outcome });
          return outcome;
        }
        const outcome: SubmitOutcome = { kind: 'bonus', word, isBonus: true };
        dispatch({ type: 'SUBMIT_RESULT', outcome });
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
        }
        return outcome;
      }
      const outcome: SubmitOutcome = { kind: 'not_a_word', word };
      dispatch({ type: 'SUBMIT_RESULT', outcome });
      return outcome;
    },
    [layout, level.id, services, state.bonusWords, state.foundAnswers, user]
  );

  useEffect(() => {
    if (submittingComplete.current) return;
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
    }
    dispatch({ type: 'MARK_COMPLETE' });
  }, [
    level.id,
    services,
    state.foundAnswers.length,
    state.hintsUsed,
    state.startedAt,
    totalAnswers,
    user,
  ]);

  const nextLevel = useCallback(() => dispatch({ type: 'NEXT_LEVEL' }), []);
  const resetLevel = useCallback(() => dispatch({ type: 'RESET_LEVEL' }), []);

  return {
    level,
    layout,
    foundAnswers: state.foundAnswers,
    bonusWords: state.bonusWords,
    lastOutcome: state.lastOutcome,
    levelCompleted: state.levelCompleted,
    totalAnswers,
    hintsUsed: state.hintsUsed,
    submitWord,
    nextLevel,
    resetLevel,
    wordDetail: (word: string) => lookup(word),
  };
}
