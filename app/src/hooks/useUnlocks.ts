import { useCallback, useEffect, useState } from 'react';
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
  /** Re-pull progress from storage. Call from useFocusEffect when a
   *  screen needs the freshest unlock state after returning from a
   *  level / quiz / etc. */
  refresh: () => void;
}

export function useUnlocks(): Unlocks {
  const services = useServices();
  const user = useCurrentUser();
  const [furthest, setFurthest] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    if (!user) return;
    services.progress.load(user.userId).then((p) => {
      // furthest is the 0-based "next playable" index.
      setFurthest(p.furthestLevelIndex);
      setLoaded(true);
    });
  }, [services, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const vocabularyAtLevel = services.remoteConfig.getNumber('feature.vocabulary.minLevel', 1);
  const globalLeaderboardAtLevel = services.remoteConfig.getNumber('leaderboard.global.minLevel', 30);
  const friendsLeaderboardAtLevel = services.remoteConfig.getNumber('friends.minLevel', 50);

  return {
    loaded,
    // furthestLevel = 1-based "next level to play".
    furthestLevel: furthest + 1,
    vocabulary: furthest + 1 >= vocabularyAtLevel,
    globalLeaderboard: furthest >= globalLeaderboardAtLevel,
    friendsLeaderboard: furthest >= friendsLeaderboardAtLevel,
    vocabularyAtLevel,
    globalLeaderboardAtLevel,
    friendsLeaderboardAtLevel,
    refresh,
  };
}
