import type { Product, Sku } from '../types';

// v8 three-currency model: Tips packs replace coin packs. Coins are
// now in-game-only (earned, not bought). Premium SKUs grant tips, set
// entitlements, or trigger one-off side-effects (streak insurance).
export const SKUS: Record<Sku, Product> = {
  // ─── Tip packs (the "fast path" — direct in-game consumable) ──────
  tip_pack_small: {
    sku: 'tip_pack_small',
    title: '提示小礼包',
    description: '8 个提示，关卡卡住一键解锁',
    priceDisplay: '¥6',
    grantTips: 8,
  },
  tip_pack_medium: {
    sku: 'tip_pack_medium',
    title: '提示中礼包',
    description: '30 个提示，超划算',
    priceDisplay: '¥18',
    grantTips: 30,
  },
  tip_pack_large: {
    sku: 'tip_pack_large',
    title: '提示大礼包',
    description: '100 个提示，长线储备',
    priceDisplay: '¥50',
    grantTips: 100,
  },

  // ─── One-shot consumable: 连胜保险 ─────────────────────────────────
  streak_insurance: {
    sku: 'streak_insurance',
    title: '连胜保险',
    description: '恢复刚断掉的连胜（48 小时内）',
    priceDisplay: '¥2',
    consumableKind: 'streak_insurance',
  },

  // ─── Entitlements (one-shot non-consumable) ───────────────────────
  remove_ads: {
    sku: 'remove_ads',
    title: '去除广告',
    description: '永久移除所有广告',
    priceDisplay: '¥18',
    entitlement: 'remove_ads',
  },
  pro_dictionary: {
    sku: 'pro_dictionary',
    title: 'Pro 词库',
    description: '解锁 5000+ 扩展词条与高级例句',
    priceDisplay: '¥30',
    entitlement: 'pro_dictionary',
  },
  exam_pack_gaokao: {
    sku: 'exam_pack_gaokao',
    title: '高考词包',
    description: '高考 3500 词 + 主题章节',
    priceDisplay: '¥18',
    entitlement: 'exam_gaokao',
  },
  exam_pack_ielts: {
    sku: 'exam_pack_ielts',
    title: '雅思词包',
    description: '雅思 B2-C1 词汇 + 真题主题',
    priceDisplay: '¥30',
    entitlement: 'exam_ielts',
  },
  exam_pack_toefl: {
    sku: 'exam_pack_toefl',
    title: '托福词包',
    description: '托福 B2-C1 词汇 + 学术真题主题',
    priceDisplay: '¥30',
    entitlement: 'exam_toefl',
  },

  // ─── Subscription ─────────────────────────────────────────────────
  subscription_monthly: {
    sku: 'subscription_monthly',
    title: '月度会员',
    description: '无广告 + 无限提示 + 每日 50 积分加成',
    priceDisplay: '¥25/月',
    entitlement: 'subscriber',
  },
};
