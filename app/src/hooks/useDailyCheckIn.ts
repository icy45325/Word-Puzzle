import { useCallback, useMemo } from 'react';
import { useEconomy } from './useEconomy';
import { useServices } from '../services';
import {
  checkInStatus,
  computeReward,
  type CheckInStatus,
  type DailyCheckInReward,
} from '../utils/dailyCheckIn';
import { feedback } from '../utils/feedback';
import { notificationsService } from '../services/notifications/NotificationsService';

export interface DailyCheckInState {
  loaded: boolean;
  status: CheckInStatus;
  reward: DailyCheckInReward;
  cycleSize: number;
  currentStreak: number;
  /** Run the full grant sequence. Returns the reward that was granted, or
   *  null if the player had already claimed today. */
  claim: () => Promise<DailyCheckInReward | null>;
}

export function useDailyCheckIn(): DailyCheckInState {
  const services = useServices();
  const { state, grant } = useEconomy();

  const cycleSize = services.remoteConfig.getNumber('streak.cycleSize', 7);
  const baseCoins = services.remoteConfig.getNumber('reward.dailyCheckIn', 20);
  const perStreakCoins = services.remoteConfig.getNumber('reward.streakPerDay', 5);
  const weeklyHints = services.remoteConfig.getNumber('streak.weeklyMilestoneHints', 1);

  const currentStreak = state?.streakDays ?? 0;
  const lastTs = state?.lastCheckInTs ?? null;

  const status = useMemo(
    () => checkInStatus(lastTs, currentStreak, Date.now(), cycleSize),
    [lastTs, currentStreak, cycleSize]
  );

  const reward = useMemo(
    () =>
      computeReward(status.nextStreak, {
        baseCoins,
        perStreakCoins,
        weeklyHints,
        cycleSize,
      }),
    [status.nextStreak, baseCoins, perStreakCoins, weeklyHints, cycleSize]
  );

  const claim = useCallback(async () => {
    if (!state) return null;
    const fresh = checkInStatus(
      state.lastCheckInTs ?? null,
      state.streakDays,
      Date.now(),
      cycleSize
    );
    if (fresh.alreadyClaimed) return null;
    // Order matters: bump streak first (sets streakDays + adds streak coins),
    // then daily_checkin (adds base coins + writes lastCheckInTs).
    await grant({ type: 'streak_increment', days: fresh.nextStreak });
    await grant({ type: 'daily_checkin' });
    if (fresh.isMilestone) {
      const milestoneHints = services.remoteConfig.getNumber(
        'streak.weeklyMilestoneHints',
        1
      );
      if (milestoneHints > 0) {
        await services.economy.grantChapterReward(state.userId, {
          chapter: 0,
          coins: 0,
          hints: milestoneHints,
        });
      }
    }
    services.analytics.track({
      name: 'daily_checkin',
      props: { streakDays: fresh.nextStreak, isMilestone: fresh.isMilestone },
    });
    feedback(fresh.isMilestone ? 'celebrate' : 'coin');
    // Re-schedule tomorrow's reminder so the streak nudge stays one day
    // ahead of the user's last claim. Fire-and-forget; if perms aren't
    // granted or the channel isn't there, the service no-ops.
    notificationsService.scheduleDailyCheckIn();
    return computeReward(fresh.nextStreak, {
      baseCoins,
      perStreakCoins,
      weeklyHints,
      cycleSize,
    });
  }, [
    baseCoins,
    cycleSize,
    grant,
    perStreakCoins,
    services.analytics,
    services.economy,
    services.remoteConfig,
    state,
    weeklyHints,
  ]);

  return {
    loaded: state != null,
    status,
    reward,
    cycleSize,
    currentStreak,
    claim,
  };
}
