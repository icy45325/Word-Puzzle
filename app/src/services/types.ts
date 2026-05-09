// All service interfaces live here so swapping a local/no-op implementation
// for a real backend (Firebase, RevenueCat, AdMob, GA4, etc.) never touches
// business components.

export type Uuid = string;

export interface User {
  userId: Uuid;
  displayName: string;
  isAnonymous: boolean;
  createdAt: number;
}

export interface AuthService {
  getCurrentUser(): Promise<User>;
  // Future: link anonymous user to a real provider (Apple / Google / WeChat).
  link(provider: 'apple' | 'google' | 'wechat' | 'email'): Promise<User>;
  signOut(): Promise<void>;
  onChange(listener: (user: User) => void): () => void;
}

export interface ProgressState {
  userId: Uuid;
  currentLevelIndex: number;
  furthestLevelIndex: number;
  completedLevelIds: string[];
  foundWordsByLevel: Record<string, string[]>;
  chapterRewardsClaimed: number[];
  schemaVersion: number;
}

export interface ProgressRepo {
  load(userId: Uuid): Promise<ProgressState>;
  save(state: ProgressState): Promise<void>;
  // Used when an anonymous user signs in to a real account — merge local data.
  migrate(fromUserId: Uuid, toUserId: Uuid): Promise<void>;
  reset(userId: Uuid): Promise<void>;
}

export interface LearnedWord {
  word: string;
  levelId: string;
  firstFoundAt: number;
  isBonus: boolean;
  // Spaced-repetition fields. Optional so legacy entries lazy-migrate to
  // sensible defaults (masteryLevel=0, nextReviewDue=firstFoundAt, etc.).
  masteryLevel?: number; // 0-5; 5 = mastered
  lastReviewedAt?: number;
  nextReviewDue?: number;
  reviewCount?: number;
  correctStreak?: number;
}

export interface LearnedWordsRepo {
  add(userId: Uuid, entry: LearnedWord): Promise<void>;
  list(userId: Uuid): Promise<LearnedWord[]>;
  migrate(fromUserId: Uuid, toUserId: Uuid): Promise<void>;
  clear(userId: Uuid): Promise<void>;
  /** Update one word's mastery + scheduling after a review attempt. */
  applyReviewResult(
    userId: Uuid,
    word: string,
    correct: boolean
  ): Promise<LearnedWord | null>;
  /** Force-set mastery (used by manual "I remember it / not yet" buttons). */
  setMastery(
    userId: Uuid,
    word: string,
    delta: 1 | -1
  ): Promise<LearnedWord | null>;
  /** Words whose nextReviewDue is in the past (default now()). */
  getDue(userId: Uuid, now?: number): Promise<LearnedWord[]>;
}

export interface Friend {
  userId: Uuid;
  displayName: string;
  addedAt: number;
}

export interface ScoreRecord {
  scoreId: Uuid;
  userId: Uuid;
  levelId: string;
  score: number;
  wordsFound: number;
  totalWords: number;
  timeMs: number;
  hintsUsed: number;
  clientTs: number;
  schemaVersion: number;
}

export type LeaderboardScope = 'self' | 'friends' | 'global';

export interface LeaderboardService {
  submit(record: ScoreRecord): Promise<void>;
  getTop(scope: LeaderboardScope, n: number): Promise<ScoreRecord[]>;
  getPersonalBest(levelId: string): Promise<ScoreRecord | null>;
  myFriendCode(userId: Uuid): string;
  listFriends(userId: Uuid): Promise<Friend[]>;
  addFriend(userId: Uuid, code: string): Promise<{ ok: boolean; reason?: string }>;
  removeFriend(userId: Uuid, friendUserId: Uuid): Promise<void>;
}

export interface EconomyState {
  userId: Uuid;
  coins: number;
  hints: number;
  streakDays: number;
  lastCheckInTs: number | null;
  schemaVersion: number;
}

export type EconomyEvent =
  | { type: 'word_found'; word: string; length: number }
  | { type: 'level_complete'; levelId: string; perfect: boolean }
  | { type: 'daily_checkin' }
  | { type: 'streak_increment'; days: number }
  | { type: 'ad_rewarded'; placement: string }
  | { type: 'iap_grant'; sku: string; coins: number };

export interface EconomyService {
  getState(userId: Uuid): Promise<EconomyState>;
  grant(userId: Uuid, event: EconomyEvent): Promise<EconomyState>;
  spend(
    userId: Uuid,
    kind: 'hint' | 'reveal_letter' | 'skip_level' | 'coins_to_hint',
    cost: number
  ): Promise<{ ok: boolean; state: EconomyState }>;
  grantChapterReward(
    userId: Uuid,
    args: { chapter: number; coins: number; hints: number }
  ): Promise<EconomyState>;
  subscribe(userId: Uuid, listener: (s: EconomyState) => void): () => void;
}

export type AdPlacement =
  | 'level_complete_interstitial'
  | 'rewarded_extra_coins'
  | 'rewarded_free_hint'
  | 'rewarded_reveal_letter';

export interface AdsService {
  isAvailable(placement: AdPlacement): boolean;
  loadRewarded(placement: AdPlacement): Promise<void>;
  showRewarded(placement: AdPlacement): Promise<{ completed: boolean }>;
  showInterstitial(placement: AdPlacement): Promise<void>;
}

export type Sku =
  | 'remove_ads'
  | 'pro_dictionary'
  | 'coin_pack_small'
  | 'coin_pack_medium'
  | 'coin_pack_large'
  | 'subscription_monthly';

export type Entitlement = 'remove_ads' | 'pro_dictionary' | 'subscriber';

export interface Product {
  sku: Sku;
  title: string;
  description: string;
  priceDisplay: string;
  grantCoins?: number;
  entitlement?: Entitlement;
}

export interface IapService {
  listProducts(): Promise<Product[]>;
  purchase(sku: Sku): Promise<{ ok: boolean; sku: Sku }>;
  restore(): Promise<Entitlement[]>;
  hasEntitlement(entitlement: Entitlement): Promise<boolean>;
}

export type AnalyticsEvent =
  | { name: 'app_open'; props?: Record<string, unknown> }
  | { name: 'level_start'; props: { levelId: string } }
  | { name: 'word_found'; props: { word: string; levelId: string; bonus: boolean } }
  | { name: 'word_detail_shown'; props: { word: string } }
  | { name: 'level_complete'; props: { levelId: string; score: number; timeMs: number } }
  | { name: 'hint_used'; props: { levelId: string; kind: string } }
  | { name: 'ad_requested'; props: { placement: string } }
  | { name: 'ad_shown'; props: { placement: string } }
  | { name: 'ad_rewarded'; props: { placement: string } }
  | { name: 'iap_checkout_start'; props: { sku: string } }
  | { name: 'iap_purchased'; props: { sku: string } }
  | { name: 'iap_failed'; props: { sku: string; reason: string } };

export interface AnalyticsService {
  track(event: AnalyticsEvent): void;
  identify(userId: Uuid, traits?: Record<string, unknown>): void;
}

export interface RemoteConfig {
  getBool(key: string, fallback: boolean): boolean;
  getNumber(key: string, fallback: number): number;
  getString(key: string, fallback: string): string;
  refresh(): Promise<void>;
}

export interface Services {
  auth: AuthService;
  progress: ProgressRepo;
  learnedWords: LearnedWordsRepo;
  leaderboard: LeaderboardService;
  economy: EconomyService;
  ads: AdsService;
  iap: IapService;
  analytics: AnalyticsService;
  remoteConfig: RemoteConfig;
}
