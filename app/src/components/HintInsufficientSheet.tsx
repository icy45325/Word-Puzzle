import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEconomy } from '../hooks/useEconomy';
import { useCurrentUser, useServices } from '../services';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after the player has gained a hint (via ad or coin exchange) so
   *  the caller can immediately re-attempt the reveal that was blocked. */
  onHintGained?: () => void;
}

export function HintInsufficientSheet({
  visible,
  onClose,
  onHintGained,
}: Props) {
  const services = useServices();
  const user = useCurrentUser();
  const { state } = useEconomy();
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const adsEnabled = services.remoteConfig.getBool('ads.enabled', false);
  const coinExchangeEnabled = services.remoteConfig.getBool(
    'hint.coinsExchange.enabled',
    true
  );
  const exchangeCost = services.remoteConfig.getNumber(
    'hint.coinsExchange.cost',
    50
  );
  const coins = state?.coins ?? 0;
  const canExchange = coinExchangeEnabled && coins >= exchangeCost;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 1400);
  }, []);

  const handleWatchAd = useCallback(async () => {
    if (!user || busy) return;
    setBusy(true);
    services.analytics.track({
      name: 'ad_requested',
      props: { placement: 'rewarded_free_hint' },
    });
    try {
      const result = await services.ads.showRewarded('rewarded_free_hint');
      if (!result.completed) {
        showToast(t('hint.sheet.adFailed'));
        return;
      }
      services.analytics.track({
        name: 'ad_rewarded',
        props: { placement: 'rewarded_free_hint' },
      });
      // Grant 1 hint by exchanging 0 coins via the spend path so we go
      // through a single mutation point. Simpler: directly bump hints
      // through grantChapterReward with 0 coins.
      await services.economy.grantChapterReward(user.userId, {
        chapter: 0,
        coins: 0,
        hints: 1,
      });
      showToast(t('hint.sheet.adRewarded'));
      onHintGained?.();
      onClose();
    } finally {
      setBusy(false);
    }
  }, [busy, onClose, onHintGained, services, showToast, user]);

  const handleExchange = useCallback(async () => {
    if (!user || busy) return;
    if (!canExchange) {
      showToast(t('hint.sheet.notEnoughCoins', { coins }));
      return;
    }
    setBusy(true);
    try {
      const result = await services.economy.spend(
        user.userId,
        'coins_to_hint',
        exchangeCost
      );
      if (!result.ok) {
        showToast(t('hint.sheet.notEnoughCoins', { coins }));
        return;
      }
      showToast(t('hint.sheet.exchanged'));
      onHintGained?.();
      onClose();
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    canExchange,
    coins,
    exchangeCost,
    onClose,
    onHintGained,
    services,
    showToast,
    user,
  ]);

  const showAd = adsEnabled;
  const showExchange = coinExchangeEnabled;
  const showNothing = !showAd && !showExchange;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{t('hint.sheet.title')}</Text>
        <Text style={styles.subtitle}>{t('hint.sheet.subtitle')}</Text>

        {showAd ? (
          <Pressable
            style={[styles.btn, { backgroundColor: theme.primary }, busy && styles.disabled]}
            onPress={handleWatchAd}
            disabled={busy}
          >
            <Text style={[styles.btnText, { color: theme.primaryText }]}>
              {t('hint.sheet.watchAd')}
            </Text>
          </Pressable>
        ) : null}

        {showExchange ? (
          <Pressable
            style={[
              styles.btn,
              styles.btnSecondary,
              (!canExchange || busy) && styles.disabled,
            ]}
            onPress={handleExchange}
            disabled={busy}
          >
            <Text style={styles.btnSecondaryText}>
              {t('hint.sheet.exchangeCoins', { cost: exchangeCost })}
            </Text>
            <Text style={styles.btnSecondaryHint}>
              当前 💰 {coins}
            </Text>
          </Pressable>
        ) : null}

        {showNothing ? (
          <Text style={styles.empty}>{t('hint.sheet.none')}</Text>
        ) : null}

        {toast ? <Text style={styles.toast}>{toast}</Text> : null}

        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>{t('hint.sheet.cancel')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 30,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  btn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '900' },
  btnSecondary: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    gap: 4,
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  btnSecondaryHint: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  disabled: { opacity: 0.55 },
  empty: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 18,
  },
  toast: {
    color: '#0F172A',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
});
