import type {
  AnalyticsService,
  EconomyService,
  Entitlement,
  IapService,
  Product,
  RemoteConfig,
  Sku,
  Uuid,
} from '../types';
import { SKUS } from './skus';
import { keys, readJson, writeJson } from '../../store/storage';

interface EntitlementsState {
  /** ISO timestamp the entitlement was granted (for analytics). */
  granted: Partial<Record<Entitlement, number>>;
}

const empty = (): EntitlementsState => ({ granted: {} });

/**
 * Local / dev IAP implementation. Used when the real react-native-iap
 * native module isn't linked (Expo Go) AND as the canonical persistence
 * layer for entitlements that the real IAP layer will read from too.
 *
 * Behavior:
 * - `iap.enabled` remote-config flag OFF → listProducts returns []
 *   and every purchase resolves to {ok:false}. Treats the store as
 *   "not yet launched".
 * - `iap.enabled` ON → listProducts returns the SKU catalog and
 *   purchase() runs a mock flow: grants coins / entitlement
 *   immediately, persists, returns {ok:true}. Useful for local UX
 *   testing without a real store account.
 *
 * The real IAP impl reuses the same `keys.entitlements(userId)` row
 * so transitioning to native purchase doesn't lose state.
 */
export class LocalIap implements IapService {
  private currentUserId: Uuid | null = null;
  private cache: EntitlementsState | null = null;

  constructor(
    private readonly rc: RemoteConfig,
    private readonly analytics: AnalyticsService,
    /** Optional injection — when present, mock purchases of coin packs
     *  call economy.grant with an iap_grant event. The provider wires
     *  this in via a setter (avoid circular construction). */
    private economy: EconomyService | null = null
  ) {}

  setEconomy(economy: EconomyService): void {
    this.economy = economy;
  }

  setUser(userId: Uuid | null): void {
    if (this.currentUserId !== userId) {
      this.currentUserId = userId;
      this.cache = null;
    }
  }

  private async loadState(): Promise<EntitlementsState> {
    if (!this.currentUserId) return empty();
    if (this.cache) return this.cache;
    const persisted = await readJson<EntitlementsState>(
      keys.entitlements(this.currentUserId)
    );
    this.cache = persisted ?? empty();
    return this.cache;
  }

  private async persist(state: EntitlementsState): Promise<void> {
    this.cache = state;
    if (!this.currentUserId) return;
    await writeJson(keys.entitlements(this.currentUserId), state);
  }

  async listProducts(): Promise<Product[]> {
    if (!this.rc.getBool('iap.enabled', false)) return [];
    return Object.values(SKUS);
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
    const product = SKUS[sku];
    if (!product) {
      this.analytics.track({
        name: 'iap_failed',
        props: { sku, reason: 'unknown_sku' },
      });
      return { ok: false, sku };
    }
    // Mock fulfillment.
    if (product.grantCoins && this.economy && this.currentUserId) {
      await this.economy.grant(this.currentUserId, {
        type: 'iap_grant',
        sku,
        coins: product.grantCoins,
      });
    }
    if (product.entitlement) {
      const state = { ...(await this.loadState()) };
      state.granted = {
        ...state.granted,
        [product.entitlement]: Date.now(),
      };
      await this.persist(state);
    }
    this.analytics.track({ name: 'iap_purchased', props: { sku } });
    return { ok: true, sku };
  }

  async restore(): Promise<Entitlement[]> {
    const state = await this.loadState();
    return Object.keys(state.granted) as Entitlement[];
  }

  async hasEntitlement(entitlement: Entitlement): Promise<boolean> {
    const state = await this.loadState();
    return state.granted[entitlement] != null;
  }
}
