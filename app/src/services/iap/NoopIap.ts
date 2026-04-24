import type {
  AnalyticsService,
  Entitlement,
  IapService,
  Product,
  RemoteConfig,
  Sku,
} from '../types';
import { SKUS } from './skus';

export class NoopIap implements IapService {
  constructor(
    private readonly rc: RemoteConfig,
    private readonly analytics: AnalyticsService
  ) {}

  async listProducts(): Promise<Product[]> {
    if (!this.rc.getBool('iap.enabled', false)) return [];
    return Object.values(SKUS);
  }

  async purchase(sku: Sku): Promise<{ ok: boolean; sku: Sku }> {
    this.analytics.track({ name: 'iap_checkout_start', props: { sku } });
    // In MVP we decline the purchase so nothing real happens, but all call
    // sites receive a well-formed response.
    this.analytics.track({
      name: 'iap_failed',
      props: { sku, reason: 'noop_iap_disabled' },
    });
    return { ok: false, sku };
  }

  async restore(): Promise<Entitlement[]> {
    return [];
  }

  async hasEntitlement(_entitlement: Entitlement): Promise<boolean> {
    return false;
  }
}
