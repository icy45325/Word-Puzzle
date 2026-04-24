import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Services, User } from './types';
import { AnonymousAuth } from './auth/AnonymousAuth';
import { LocalProgressRepo } from './progress/LocalProgressRepo';
import { LocalLeaderboard } from './leaderboard/LocalLeaderboard';
import { LocalEconomy } from './economy/LocalEconomy';
import { NoopAds } from './ads/NoopAds';
import { NoopIap } from './iap/NoopIap';
import { ConsoleAnalytics } from './analytics/ConsoleAnalytics';
import { StaticRemoteConfig } from './remoteConfig/StaticRemoteConfig';

export function createDefaultServices(): Services {
  const remoteConfig = new StaticRemoteConfig();
  const analytics = new ConsoleAnalytics();
  const auth = new AnonymousAuth();
  const progress = new LocalProgressRepo();
  const leaderboard = new LocalLeaderboard();
  const economy = new LocalEconomy(remoteConfig);
  const ads = new NoopAds(remoteConfig, analytics);
  const iap = new NoopIap(remoteConfig, analytics);
  return { auth, progress, leaderboard, economy, ads, iap, analytics, remoteConfig };
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
    (async () => {
      await resolved.remoteConfig.refresh();
      const u = await resolved.auth.getCurrentUser();
      if (cancelled) return;
      resolved.analytics.identify(u.userId, { displayName: u.displayName });
      resolved.analytics.track({ name: 'app_open' });
      setUser(u);
    })();
    return () => {
      cancelled = true;
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
