import type { Product, Sku } from '../types';

export const SKUS: Record<Sku, Product> = {
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
  coin_pack_small: {
    sku: 'coin_pack_small',
    title: '金币小礼包',
    description: '500 金币',
    priceDisplay: '¥6',
    grantCoins: 500,
  },
  coin_pack_medium: {
    sku: 'coin_pack_medium',
    title: '金币中礼包',
    description: '1500 金币',
    priceDisplay: '¥18',
    grantCoins: 1500,
  },
  coin_pack_large: {
    sku: 'coin_pack_large',
    title: '金币大礼包',
    description: '5000 金币',
    priceDisplay: '¥50',
    grantCoins: 5000,
  },
  subscription_monthly: {
    sku: 'subscription_monthly',
    title: '月度会员',
    description: '无广告 + Pro 词库 + 每日金币奖励',
    priceDisplay: '¥25/月',
    entitlement: 'subscriber',
  },
};
