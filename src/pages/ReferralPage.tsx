import type { JSX } from 'react';
import { useApp } from '../app/AppProvider';
import { useToast } from '../app/ToastProvider';
import { Button } from '../components/Button';
import { useI18n } from '../i18n/I18nProvider';

type SharingNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Use the compatible document fallback below.
  }

  const area = document.createElement('textarea');
  area.value = value;
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const copied = typeof document.execCommand === 'function' && document.execCommand('copy');
  area.remove();
  return copied;
}

export function ReferralPage(): JSX.Element {
  const { state } = useApp();
  const { showToast } = useToast();
  const { formatMoney, t } = useI18n();
  const { referral } = state;

  const copyLink = async () => {
    const copied = await copyText(referral.telegramLink);
    showToast({
      kind: copied ? 'info' : 'error',
      text: t(copied ? 'referrals.toasts.copied' : 'referrals.toasts.copyFailed'),
    });
  };

  const shareLink = async () => {
    const sharingNavigator = navigator as SharingNavigator;
    if (typeof sharingNavigator.share === 'function') {
      try {
        await sharingNavigator.share({ title: t('referrals.title'), url: referral.telegramLink });
        return;
      } catch {
        // Users without an available share target still receive the link in their clipboard.
      }
    }
    await copyLink();
  };

  const stats = [
    { label: t('referrals.stats.reward'), value: `${referral.rewardPercent}%` },
    { label: t('referrals.stats.invited'), value: String(referral.invited) },
    { label: t('referrals.stats.active'), value: String(referral.active) },
    { label: t('referrals.stats.earned'), value: formatMoney(referral.earned) },
  ];

  return (
    <section className="wallet-page referral-page">
      <div className="page-heading">
        <h1>{t('referrals.title')}</h1>
        <p>{t('referrals.description')}</p>
      </div>

      <dl className="referral-stats">
        {stats.map((stat) => (
          <div className="wallet-card referral-stats__item" key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="telegram-link-title" className="wallet-card referral-link">
        <h2 id="telegram-link-title">{t('referrals.telegram.title')}</h2>
        <p className="referral-link__value">{referral.telegramLink}</p>
        <div className="referral-link__actions">
          <Button onClick={() => void copyLink()} variant="utility">{t('referrals.telegram.copy')}</Button>
          <Button onClick={() => void shareLink()} variant="primary">{t('referrals.telegram.share')}</Button>
        </div>
      </section>
    </section>
  );
}
