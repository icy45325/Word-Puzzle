import { Platform } from 'react-native';
import type {
  AdPlacement,
  AdsService,
  AnalyticsService,
  RemoteConfig,
} from '../types';

// Lazy `require` so the file is import-safe in Expo Go (which lacks the
// native module). If the require fails, `admob` stays null and the
// provider falls back to NoopAds.
let admob: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  admob = require('react-native-google-mobile-ads');
} catch {
  admob = null;
}

/** Return value of `admob` if the native SDK loaded; otherwise null. */
export function isAdMobLoaded(): boolean {
  return admob != null && typeof admob.RewardedAd?.createForAdRequest === 'function';
}

const TEST_IDS = {
  android: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  ios: {
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  },
};

type AdKind = 'rewarded' | 'interstitial';

export class MobileAdsService implements AdsService {
  private rewardedCache = new Map<AdPlacement, any>();
  private initialized = false;

  constructor(
    private readonly rc: RemoteConfig,
    private readonly analytics: AnalyticsService
  ) {}

  private async ensureInit(): Promise<void> {
    if (this.initialized) return;
    if (!isAdMobLoaded()) return;
    try {
      await admob.default().initialize();
      this.initialized = true;
    } catch {
      // swallow init failure — isAdMobLoaded check on every method call
      // means we'll just no-op out; the NoopAds fallback path handles the
      // rest at the provider level.
    }
  }

  private resolveUnitId(kind: AdKind): string {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const useTest = this.rc.getBool('ads.useTestIds', true);
    if (useTest) return TEST_IDS[platform][kind];
    const configured = this.rc.getString(
      `ads.unitId.${platform}.${kind}`,
      ''
    );
    return configured || TEST_IDS[platform][kind];
  }

  isAvailable(placement: AdPlacement): boolean {
    if (!this.rc.getBool('ads.enabled', false)) return false;
    if (!isAdMobLoaded()) return false;
    return this.rc.getBool(`ads.${placement}.enabled`, true);
  }

  async loadRewarded(placement: AdPlacement): Promise<void> {
    if (!this.isAvailable(placement)) return;
    await this.ensureInit();
    if (!isAdMobLoaded()) return;
    const unitId = this.resolveUnitId('rewarded');
    const ad = admob.RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    this.rewardedCache.set(placement, ad);
    this.analytics.track({ name: 'ad_requested', props: { placement } });
    return new Promise<void>((resolve) => {
      const unsub = ad.addAdEventListener(
        admob.RewardedAdEventType.LOADED,
        () => {
          unsub();
          resolve();
        }
      );
      ad.load();
    });
  }

  async showRewarded(placement: AdPlacement): Promise<{ completed: boolean }> {
    if (!this.isAvailable(placement)) {
      // Mirror NoopAds behavior so callers don't need branching: if ads
      // are disabled, treat as immediate success so the reward still fires.
      this.analytics.track({ name: 'ad_rewarded', props: { placement } });
      return { completed: true };
    }
    await this.ensureInit();
    if (!isAdMobLoaded()) return { completed: true };

    let ad = this.rewardedCache.get(placement);
    if (!ad || !ad.loaded) {
      // Load on demand if there's no preloaded ad.
      const unitId = this.resolveUnitId('rewarded');
      ad = admob.RewardedAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: true,
      });
      this.rewardedCache.set(placement, ad);
      await new Promise<void>((resolve, reject) => {
        const unsubLoaded = ad.addAdEventListener(
          admob.RewardedAdEventType.LOADED,
          () => {
            unsubLoaded();
            resolve();
          }
        );
        const unsubError = ad.addAdEventListener(
          admob.AdEventType.ERROR,
          (err: unknown) => {
            unsubError();
            reject(err);
          }
        );
        ad.load();
      }).catch(() => undefined);
    }

    this.analytics.track({ name: 'ad_shown', props: { placement } });

    return new Promise<{ completed: boolean }>((resolve) => {
      let earned = false;
      const unsubEarned = ad.addAdEventListener(
        admob.RewardedAdEventType.EARNED_REWARD,
        () => {
          earned = true;
          this.analytics.track({ name: 'ad_rewarded', props: { placement } });
        }
      );
      const unsubClosed = ad.addAdEventListener(
        admob.AdEventType.CLOSED,
        () => {
          unsubEarned();
          unsubClosed();
          this.rewardedCache.delete(placement);
          resolve({ completed: earned });
        }
      );
      try {
        ad.show();
      } catch {
        unsubEarned();
        unsubClosed();
        resolve({ completed: false });
      }
    });
  }

  async showInterstitial(placement: AdPlacement): Promise<void> {
    if (!this.isAvailable(placement)) return;
    await this.ensureInit();
    if (!isAdMobLoaded()) return;
    const unitId = this.resolveUnitId('interstitial');
    const ad = admob.InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    this.analytics.track({ name: 'ad_requested', props: { placement } });
    await new Promise<void>((resolve) => {
      const unsubLoaded = ad.addAdEventListener(
        admob.AdEventType.LOADED,
        () => {
          unsubLoaded();
          this.analytics.track({ name: 'ad_shown', props: { placement } });
          ad.show();
        }
      );
      const unsubClosed = ad.addAdEventListener(
        admob.AdEventType.CLOSED,
        () => {
          unsubClosed();
          resolve();
        }
      );
      const unsubError = ad.addAdEventListener(
        admob.AdEventType.ERROR,
        () => {
          unsubError();
          resolve();
        }
      );
      try {
        ad.load();
      } catch {
        resolve();
      }
    });
  }
}
