import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser, useServices } from '../services';
import type { Entitlement, Product, Sku } from '../services/types';

interface EntitlementsState {
  loaded: boolean;
  removeAds: boolean;
  proDictionary: boolean;
  subscriber: boolean;
  /** Catalog of purchasable products. Empty when `iap.enabled` is false. */
  products: Product[];
  /** Refresh from the IAP service (call after a purchase / restore). */
  refresh: () => Promise<void>;
  /** Convenience purchase wrapper that refreshes on completion. */
  purchase: (sku: Sku) => Promise<boolean>;
  /** Restore prior non-consumable purchases. Returns granted entitlement list. */
  restore: () => Promise<Entitlement[]>;
}

const ENTITLEMENT_KEYS: Entitlement[] = [
  'remove_ads',
  'pro_dictionary',
  'subscriber',
];

export function useEntitlements(): EntitlementsState {
  const services = useServices();
  const user = useCurrentUser();
  const [removeAds, setRemoveAds] = useState(false);
  const [proDictionary, setProDictionary] = useState(false);
  const [subscriber, setSubscriber] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [list, ra, pd, sb] = await Promise.all([
      services.iap.listProducts(),
      services.iap.hasEntitlement('remove_ads'),
      services.iap.hasEntitlement('pro_dictionary'),
      services.iap.hasEntitlement('subscriber'),
    ]);
    setProducts(list);
    setRemoveAds(ra);
    setProDictionary(pd);
    setSubscriber(sb);
    setLoaded(true);
  }, [services.iap]);

  useEffect(() => {
    refresh();
  }, [refresh, user]);

  const purchase = useCallback(
    async (sku: Sku) => {
      const result = await services.iap.purchase(sku);
      await refresh();
      return result.ok;
    },
    [services.iap, refresh]
  );

  const restore = useCallback(async () => {
    const granted = await services.iap.restore();
    await refresh();
    return granted;
  }, [services.iap, refresh]);

  // Suppress unused-import lint for ENTITLEMENT_KEYS — kept for future
  // dynamic-entitlement iteration if we add more SKUs.
  void ENTITLEMENT_KEYS;

  return {
    loaded,
    removeAds,
    proDictionary,
    subscriber,
    products,
    refresh,
    purchase,
    restore,
  };
}
