import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Services, User } from './types';
import { AnonymousAuth } from './auth/AnonymousAuth';
import { LocalProgressRepo } from './progress/LocalProgressRepo';
import { LocalLearnedWordsRepo } from './learnedWords/LocalLearnedWordsRepo';
import { LocalLeaderboard } from './leaderboard/LocalLeaderboard';
import { LocalEconomy } from './economy/LocalEconomy';
import { NoopAds } from './ads/NoopAds';
import { MobileAdsService, isAdMobLoaded } from './ads/MobileAdsService';
import { LocalIap } from './iap/LocalIap';
import { RealIap, isIapLoaded } from './iap/RealIap';
import { ConsoleAnalytics } from './analytics/ConsoleAnalytics';
import { StaticRemoteConfig } from './remoteConfig/StaticRemoteConfig';

export function createDefaultServices(): Services {
  const remoteConfig = new StaticRemoteConfig();
  const analytics = new ConsoleAnalytics();
  const auth = new AnonymousAuth(
    new LocalProgressRepo(),
    new LocalLearnedWordsRepo()
  );
  const progress = new LocalProgressRepo();
  const learnedWords = new LocalLearnedWordsRepo();
  const leaderboard = new LocalLeaderboard();
  const economy = new LocalEconomy(remoteConfig);
  const ads = isAdMobLoaded()
    ? new MobileAdsService(remoteConfig, analytics)
    : new NoopAds(remoteConfig, analytics);
  // LocalIap is always the canonical persistence layer for entitlements
  // and coin grants. RealIap (if the native module is linked) delegates
  // fulfillment through it so reads stay consistent regardless of which
  // path produced the entitlement.
  const localIap = new LocalIap(remoteConfig, analytics, economy);
  const iap = isIapLoaded()
    ? new RealIap(remoteConfig, analytics, localIap)
    : localIap;
  return {
    auth,
    progress,
    learnedWords,
    leaderboard,
    economy,
    ads,
    iap,
    analytics,
    remoteConfig,
  };
}

interface Ctx {
  services: Services;
  user: User | null;
}

const ServicesContext = createContext<Ctx | null>(null);

interface Props {
  services?: Services;
  children: React.ReactNode;
}

export function ServicesProvider({ services, children }: Props) {
  const resolved = useMemo(() => services ?? createDefaultServices(), [services]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    const propagateUser = (uid: string | null) => {
      // IAP needs to know the current user so entitlement reads/writes
      // hit the right AsyncStorage row. LocalIap exposes setUser; RealIap
      // forwards to its inner LocalIap. We detect either path via the
      // setUser method presence.
      const anyIap = resolved.iap as { setUser?: (uid: string | null) => void };
      if (typeof anyIap.setUser === 'function') anyIap.setUser(uid);
    };
    (async () => {
      await resolved.remoteConfig.refresh();
      const u = await resolved.auth.getCurrentUser();
      if (cancelled) return;
      resolved.analytics.identify(u.userId, { displayName: u.displayName });
      resolved.analytics.track({ name: 'app_open' });
      propagateUser(u.userId);
      setUser(u);
    })();
    const unsub = resolved.auth.onChange((u) => {
      propagateUser(u?.userId ?? null);
      setUser(u);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [resolved]);

  const value = useMemo(() => ({ services: resolved, user }), [resolved, user]);
  return (
    <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
  );
}

export function useServices(): Services {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used inside ServicesProvider');
  return ctx.services;
}

export function useCurrentUser(): User | null {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useCurrentUser must be used inside ServicesProvider');
  return ctx.user;
}
