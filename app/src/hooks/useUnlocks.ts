import { useEffect, useState } from 'react';
import { useCurrentUser, useServices } from '../services';

export interface Unlocks {
  loaded: boolean;
  furthestLevel: number; // 1-based level number player has reached
  vocabulary: boolean;
  globalLeaderboard: boolean;
  friendsLeaderboard: boolean;
  vocabularyAtLevel: number;
  globalLeaderboardAtLevel: number;
  friendsLeaderboardAtLevel: number;
}

export function useUnlocks(): Unlocks {
  const services = useServices();
  const user = useCurrentUser();
  const [furthest, setFurthest] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const p = await services.progress.load(user.userId);
      if (cancelled) return;
      // furthest is "next playable" index; for unlock thresholds we want
      // the highest level the player has actually completed, which is
      // furthestLevelIndex (since furthestLevelIndex bumps to completedIdx+1).
      setFurthest(p.furthestLevelIndex);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [services, user]);

  const vocabularyAtLevel = services.remoteConfig.getNumber('feature.vocabulary.minLevel', 1);
  const globalLeaderboardAtLevel = services.remoteConfig.getNumber('leaderboard.global.minLevel', 30);
  const friendsLeaderboardAtLevel = services.remoteConfig.getNumber('friends.minLevel', 50);

  // furthest is 0-based "next playable"; unlock when (furthest >= threshold).
  // i.e. completed level >= threshold means furthestLevelIndex == threshold.
  return {
    loaded,
    furthestLevel: furthest + 1,
    vocabulary: furthest + 1 >= vocabularyAtLevel,
    globalLeaderboard: furthest >= globalLeaderboardAtLevel,
    friendsLeaderboard: furthest >= friendsLeaderboardAtLevel,
    vocabularyAtLevel,
    globalLeaderboardAtLevel,
    friendsLeaderboardAtLevel,
  };
}
