import type { AdPlacement, AdsService, AnalyticsService, RemoteConfig } from '../types';

export class NoopAds implements AdsService {
  constructor(
    private readonly rc: RemoteConfig,
    private readonly analytics: AnalyticsService
  ) {}

  isAvailable(placement: AdPlacement): boolean {
    if (!this.rc.getBool('ads.enabled', false)) return false;
    return this.rc.getBool(`ads.${placement}.enabled`, true);
  }

  async loadRewarded(placement: AdPlacement): Promise<void> {
    this.analytics.track({ name: 'ad_requested', props: { placement } });
  }

  async showRewarded(placement: AdPlacement): Promise<{ completed: boolean }> {
    this.analytics.track({ name: 'ad_shown', props: { placement } });
    // In MVP we always grant the reward; the real SDK will honor user
    // completion. Keep the Promise signature stable so callers never change.
    this.analytics.track({ name: 'ad_rewarded', props: { placement } });
    return { completed: true };
  }

  async showInterstitial(placement: AdPlacement): Promise<void> {
    this.analytics.track({ name: 'ad_shown', props: { placement } });
  }
}
