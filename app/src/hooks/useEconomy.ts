import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser, useServices } from '../services';
import type { EconomyEvent, EconomyState } from '../services/types';

export function useEconomy() {
  const services = useServices();
  const user = useCurrentUser();
  const [state, setState] = useState<EconomyState | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    services.economy.getState(user.userId).then((s) => {
      if (!cancelled) setState(s);
    });
    const unsub = services.economy.subscribe(user.userId, (s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [services, user]);

  const grant = useCallback(
    async (event: EconomyEvent) => {
      if (!user) return null;
      const next = await services.economy.grant(user.userId, event);
      setState(next);
      return next;
    },
    [services, user]
  );

  return { state, grant };
}
