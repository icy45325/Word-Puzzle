import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { TopBar } from '../components/TopBar';
import { useTheme } from '../theme/ThemeProvider';
import { useEntitlements } from '../hooks/useEntitlements';
import { useEconomy } from '../hooks/useEconomy';
import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import type { Product, Sku } from '../services/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Store'>;

export function StoreScreen({ navigation }: Props) {
  useLocale();
  const { theme } = useTheme();
  const { state: economy } = useEconomy();
  const entitlements = useEntitlements();
  const [pendingSku, setPendingSku] = useState<Sku | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2000);
  };

  const handlePurchase = async (sku: Sku) => {
    setPendingSku(sku);
    const ok = await entitlements.purchase(sku);
    setPendingSku(null);
    showToast(
      ok
        ? t('store.purchaseSuccess', undefined, '购买成功')
        : t('store.purchaseFailed', undefined, '购买未完成')
    );
  };

  const handleRestore = async () => {
    setPendingSku('remove_ads'); // arbitrary, just for the loader
    await entitlements.restore();
    setPendingSku(null);
    showToast(t('store.restoreDone', undefined, '已恢复购买'));
  };

  const tipPacks = entitlements.products.filter(
    (p) => p.grantTips != null
  );
  const consumables = entitlements.products.filter(
    (p) => p.consumableKind != null
  );
  const entitlementProducts = entitlements.products.filter(
    (p) => p.entitlement && p.sku !== 'subscription_monthly'
  );
  const subscriptions = entitlements.products.filter(
    (p) => p.sku === 'subscription_monthly'
  );

  const storeEmpty = entitlements.loaded && entitlements.products.length === 0;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar />
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{t('store.title', undefined, '商店')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* Show coin + tip balances side by side: coins are the
              in-game-only currency that exchanges for tips, tips are
              what the player actually spends. Both matter at a glance. */}
          <View style={styles.balanceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>
                {t('store.balanceCoins', undefined, '金币')}
              </Text>
              <Text style={styles.balanceValue}>💰 {economy?.coins ?? 0}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.balanceLabel}>
                {t('store.balanceTips', undefined, '提示')}
              </Text>
              <Text style={styles.balanceValue}>💡 {economy?.hints ?? 0}</Text>
            </View>
          </View>

          {storeEmpty ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {t(
                  'store.empty',
                  undefined,
                  '商店暂未开放。开启 iap.enabled 或绑定真实商品 ID 后即可上架。'
                )}
              </Text>
            </View>
          ) : null}

          {tipPacks.length > 0 ? (
            <Section title={t('store.section.tips', undefined, '提示礼包')}>
              {tipPacks.map((p) => (
                <PackCard
                  key={p.sku}
                  product={p}
                  loading={pendingSku === p.sku}
                  primaryColor={theme.primary}
                  onPress={() => handlePurchase(p.sku)}
                />
              ))}
            </Section>
          ) : null}

          {consumables.length > 0 ? (
            <Section
              title={t('store.section.consumables', undefined, '一次性道具')}
            >
              {consumables.map((p) => (
                <UpgradeCard
                  key={p.sku}
                  product={p}
                  owned={false}
                  loading={pendingSku === p.sku}
                  primaryColor={theme.primary}
                  primaryText={theme.primaryText}
                  onPress={() => handlePurchase(p.sku)}
                />
              ))}
            </Section>
          ) : null}

          {entitlementProducts.length > 0 ? (
            <Section title={t('store.section.upgrades', undefined, '解锁项')}>
              {entitlementProducts.map((p) => {
                const owned =
                  p.entitlement === 'remove_ads'
                    ? entitlements.removeAds
                    : p.entitlement === 'pro_dictionary'
                    ? entitlements.proDictionary
                    : p.entitlement === 'exam_ielts'
                    ? entitlements.examIelts
                    : p.entitlement === 'exam_toefl'
                    ? entitlements.examToefl
                    : p.entitlement === 'exam_gaokao'
                    ? entitlements.examGaokao
                    : false;
                return (
                  <UpgradeCard
                    key={p.sku}
                    product={p}
                    owned={owned}
                    loading={pendingSku === p.sku}
                    primaryColor={theme.primary}
                    primaryText={theme.primaryText}
                    onPress={() => !owned && handlePurchase(p.sku)}
                  />
                );
              })}
            </Section>
          ) : null}

          {subscriptions.length > 0 ? (
            <Section title={t('store.section.subscription', undefined, '订阅')}>
              {subscriptions.map((p) => (
                <UpgradeCard
                  key={p.sku}
                  product={p}
                  owned={entitlements.subscriber}
                  loading={pendingSku === p.sku}
                  primaryColor={theme.primary}
                  primaryText={theme.primaryText}
                  onPress={() =>
                    !entitlements.subscriber && handlePurchase(p.sku)
                  }
                />
              ))}
            </Section>
          ) : null}

          {entitlements.products.length > 0 ? (
            <Pressable style={styles.restoreBtn} onPress={handleRestore}>
              <Text style={styles.restoreText}>
                ↻ {t('store.restore', undefined, '恢复购买')}
              </Text>
            </Pressable>
          ) : null}

          <Text style={styles.disclaimer}>
            {t(
              'store.disclaimer',
              undefined,
              '价格仅供参考。真实购买在 EAS preview / 正式版 + 已上架商品后才会走系统弹窗。'
            )}
          </Text>
        </ScrollView>

        {toast ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </GradientBackground>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionItems}>{children}</View>
    </View>
  );
}

interface PackCardProps {
  product: Product;
  loading: boolean;
  primaryColor: string;
  onPress: () => void;
}

function PackCard({ product, loading, primaryColor, onPress }: PackCardProps) {
  return (
    <Pressable style={styles.packCard} onPress={onPress} disabled={loading}>
      <View style={styles.packIconWrap}>
        <Text style={styles.packIcon}>💡</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.packTitle}>{product.title}</Text>
        <Text style={styles.packSub}>
          {product.grantTips} {t('store.tipsLabel', undefined, '个提示')}
        </Text>
      </View>
      <View
        style={[
          styles.priceBtn,
          { backgroundColor: primaryColor },
          loading && styles.priceBtnDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.priceText}>{product.priceDisplay}</Text>
        )}
      </View>
    </Pressable>
  );
}

interface UpgradeCardProps {
  product: Product;
  owned: boolean;
  loading: boolean;
  primaryColor: string;
  primaryText: string;
  onPress: () => void;
}

function UpgradeCard({
  product,
  owned,
  loading,
  primaryColor,
  primaryText,
  onPress,
}: UpgradeCardProps) {
  return (
    <Pressable
      style={styles.upgradeCard}
      onPress={onPress}
      disabled={loading || owned}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.upgradeTitle}>{product.title}</Text>
        <Text style={styles.upgradeDesc}>{product.description}</Text>
      </View>
      {owned ? (
        <View style={styles.ownedBadge}>
          <Text style={styles.ownedText}>
            ✓ {t('store.owned', undefined, '已拥有')}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.priceBtn,
            { backgroundColor: primaryColor },
            loading && styles.priceBtnDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={primaryText} size="small" />
          ) : (
            <Text style={[styles.priceText, { color: primaryText }]}>
              {product.priceDisplay}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#F8FAFC', marginTop: -3 },
  title: { fontSize: 24, fontWeight: '900', color: '#F8FAFC', letterSpacing: -0.5 },
  body: { padding: 20, paddingBottom: 40, gap: 18 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FACC15',
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
  },
  sectionItems: { gap: 10 },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  packIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(250,204,21,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packIcon: { fontSize: 22 },
  packTitle: { fontSize: 15, fontWeight: '900', color: '#F8FAFC' },
  packSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  upgradeTitle: { fontSize: 15, fontWeight: '900', color: '#F8FAFC' },
  upgradeDesc: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 16,
  },
  priceBtn: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBtnDisabled: { opacity: 0.5 },
  priceText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  ownedBadge: {
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderColor: 'rgba(34,197,94,0.40)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ownedText: { color: '#34D399', fontWeight: '900', fontSize: 12 },
  restoreBtn: {
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 4,
  },
  restoreText: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  emptyWrap: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 19,
  },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  toastText: { color: '#F8FAFC', fontWeight: '700' },
});
