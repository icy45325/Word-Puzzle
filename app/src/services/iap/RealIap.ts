// Real in-app-purchase implementation wrapping react-native-iap. Falls
// back to LocalIap automatically (handled in ServicesProvider) when the
// native module isn't linked (Expo Go, web preview, etc.).
//
// The lazy `require` pattern keeps this file import-safe everywhere:
// metro can resolve it, but if the native module isn't installed (or
// crashes at boot) we leave `iap = null` and `isIapLoaded()` returns
// false so the provider picks LocalIap instead.
//
// To wire this up for real:
//   1. `npm i react-native-iap` (use v12.x for Expo SDK 51 / RN 0.74)
//   2. Register the SKUs in `app/src/services/iap/skus.ts` with their
//      real Google Play / App Store product IDs.
//   3. Create matching managed products in Google Play Console and
//      App Store Connect with the same SKU strings.
//   4. Flip `iap.enabled` to true in remoteConfigDefaults.
//   5. EAS-build a preview APK — Expo Go can NOT test real IAP.

import type {
  AnalyticsService,
  Entitlement,
  IapService,
  Product,
  RemoteConfig,
  Sku,
  Uuid,
} from '../types';
import { SKUS } from './skus';
import type { LocalIap } from './LocalIap';

let iap: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  iap = require('react-native-iap');
} catch {
  iap = null;
}

export function isIapLoaded(): boolean {
  return (
    iap != null &&
    typeof iap.initConnection === 'function' &&
    typeof iap.requestPurchase === 'function'
  );
}

const CONSUMABLE_SKUS = new Set<Sku>([
  'coin_pack_small',
  'coin_pack_medium',
  'coin_pack_large',
]);
const NON_CONSUMABLE_SKUS = new Set<Sku>(['remove_ads', 'pro_dictionary']);
const SUBSCRIPTION_SKUS = new Set<Sku>(['subscription_monthly']);

export class RealIap implements IapService {
  private initialized = false;
  private cachedProducts: Product[] | null = null;
  private currentUserId: Uuid | null = null;

  constructor(
    private readonly rc: RemoteConfig,
    private readonly analytics: AnalyticsService,
    /** LocalIap is the canonical persistence layer. We delegate
     *  entitlement reads + coin grants through it so the rest of the
     *  app reads from one source whether the native module is loaded
     *  or not. */
    private readonly local: LocalIap
  ) {}

  setUser(userId: Uuid | null): void {
    this.currentUserId = userId;
    this.local.setUser(userId);
  }

  private async ensureInit(): Promise<boolean> {
    if (this.initialized) return true;
    if (!isIapLoaded()) return false;
    try {
      await iap.initConnection();
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  async listProducts(): Promise<Product[]> {
    if (!this.rc.getBool('iap.enabled', false)) return [];
    if (!(await this.ensureInit())) return [];
    if (this.cachedProducts) return this.cachedProducts;
    try {
      const consumable = [...CONSUMABLE_SKUS];
      const nonConsumable = [...NON_CONSUMABLE_SKUS];
      const subscriptions = [...SUBSCRIPTION_SKUS];
      const products: any[] = await iap.getProducts({
        skus: [...consumable, ...nonConsumable],
      });
      const subs: any[] = subscriptions.length
        ? await iap.getSubscriptions({ skus: subscriptions })
        : [];
      const all = [...products, ...subs];
      this.cachedProducts = all.map((p) => {
        const localFallback = SKUS[p.productId as Sku] ?? SKUS.coin_pack_small;
        return {
          ...localFallback,
          sku: p.productId as Sku,
          priceDisplay:
            p.localizedPrice ??
            p.price ??
            localFallback.priceDisplay,
        };
      });
      return this.cachedProducts;
    } catch {
      return [];
    }
  }

  async purchase(sku: Sku): Promise<{ ok: boolean; sku: Sku }> {
    this.analytics.track({ name: 'iap_checkout_start', props: { sku } });
    if (!this.rc.getBool('iap.enabled', false)) {
      this.analytics.track({
        name: 'iap_failed',
        props: { sku, reason: 'iap_disabled' },
      });
      return { ok: false, sku };
    }
    if (!(await this.ensureInit())) {
      this.analytics.track({
        name: 'iap_failed',
        props: { sku, reason: 'native_module_missing' },
      });
      return { ok: false, sku };
    }
    try {
      if (SUBSCRIPTION_SKUS.has(sku)) {
        await iap.requestSubscription({ sku });
      } else {
        await iap.requestPurchase({ sku });
      }
      // requestPurchase resolves with the purchase object on Android;
      // on iOS the transaction completes via the purchaseUpdateListener.
      // For MVP we treat the resolved Promise as success; production
      // should verify receipts server-side before granting entitlement.
      const product = SKUS[sku];
      if (product?.grantCoins && this.currentUserId) {
        await this.local.purchase(sku); // delegate fulfillment + persistence
      } else if (product?.entitlement) {
        await this.local.purchase(sku);
      }
      this.analytics.track({ name: 'iap_purchased', props: { sku } });
      return { ok: true, sku };
    } catch (err: any) {
      const reason = String(err?.message ?? err ?? 'unknown_error');
      this.analytics.track({
        name: 'iap_failed',
        props: { sku, reason },
      });
      return { ok: false, sku };
    }
  }

  async restore(): Promise<Entitlement[]> {
    if (!(await this.ensureInit())) return this.local.restore();
    try {
      const purchases: any[] = await iap.getAvailablePurchases();
      const skus = purchases.map((p) => p.productId as Sku);
      // Re-grant each entitlement via LocalIap so the persistence layer
      // stays consistent.
      for (const sku of skus) {
        const product = SKUS[sku];
        if (product?.entitlement) await this.local.purchase(sku);
      }
      return this.local.restore();
    } catch {
      return this.local.restore();
    }
  }

  async hasEntitlement(entitlement: Entitlement): Promise<boolean> {
    return this.local.hasEntitlement(entitlement);
  }
}
