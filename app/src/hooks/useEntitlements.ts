import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser, useServices } from '../services';
import type { Entitlement, Product, Sku } from '../services/types';

interface EntitlementsState {
  loaded: boolean;
  removeAds: boolean;
  proDictionary: boolean;
  subscriber: boolean;
  examIelts: boolean;
  examToefl: boolean;
  examGaokao: boolean;
  /** Catalog of purchasable products. Empty when `iap.enabled` is false. */
  products: Product[];
  /** Refresh from the IAP service (call after a purchase / restore). */
  refresh: () => Promise<void>;
  /** Convenience purchase wrapper that refreshes on completion. */
  purchase: (sku: Sku) => Promise<boolean>;
  /** Restore prior non-consumable purchases. Returns granted entitlement list. */
  restore: () => Promise<Entitlement[]>;
}

export function useEntitlements(): EntitlementsState {
  const services = useServices();
  const user = useCurrentUser();
  const [removeAds, setRemoveAds] = useState(false);
  const [proDictionary, setProDictionary] = useState(false);
  const [subscriber, setSubscriber] = useState(false);
  const [examIelts, setExamIelts] = useState(false);
  const [examToefl, setExamToefl] = useState(false);
  const [examGaokao, setExamGaokao] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [list, ra, pd, sb, ie, to, gk] = await Promise.all([
      services.iap.listProducts(),
      services.iap.hasEntitlement('remove_ads'),
      services.iap.hasEntitlement('pro_dictionary'),
      services.iap.hasEntitlement('subscriber'),
      services.iap.hasEntitlement('exam_ielts'),
      services.iap.hasEntitlement('exam_toefl'),
      services.iap.hasEntitlement('exam_gaokao'),
    ]);
    setProducts(list);
    setRemoveAds(ra);
    setProDictionary(pd);
    setSubscriber(sb);
    setExamIelts(ie);
    setExamToefl(to);
    setExamGaokao(gk);
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

  return {
    loaded,
    removeAds,
    proDictionary,
    subscriber,
    examIelts,
    examToefl,
    examGaokao,
    products,
    refresh,
    purchase,
    restore,
  };
}
