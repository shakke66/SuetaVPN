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

  return (
    <section className="wallet-page referral-page">
      <div className="page-heading">
        <h1>{t('referrals.title')}</h1>
      </div>

      {/* Заработок это ответ на главный вопрос раздела, поэтому он один
          крупный. Условие и счётчики людей идут подписью, а не четырьмя
          карточками равного веса. */}
      <section className="referral-summary" data-testid="referral-summary">
        <span className="referral-summary__label">{t('referrals.stats.earned')}</span>
        <strong className="referral-summary__value">{formatMoney(referral.earned)}</strong>
        <p className="referral-summary__reward">
          {t('referrals.rewardLine', { amount: String(referral.rewardPercent) })}
        </p>
        <dl className="referral-summary__people">
          <div>
            <dt>{t('referrals.stats.invited')}</dt>
            <dd>{referral.invited}</dd>
          </div>
          <div>
            <dt>{t('referrals.stats.active')}</dt>
            <dd>{referral.active}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="telegram-link-title" className="referral-share">
        <h2 className="referral-share__label" id="telegram-link-title">{t('referrals.telegram.title')}</h2>
        {/* Ссылку не читают, её копируют, поэтому она в одну строку с
            обрезкой, а кнопка стоит рядом. */}
        <div className="referral-share__row">
          <p className="referral-share__value">{referral.telegramLink}</p>
          <Button onClick={() => void copyLink()} variant="utility">
            {t('referrals.telegram.copyShort')}
          </Button>
        </div>
        <Button onClick={() => void shareLink()} variant="primary">
          {t('referrals.telegram.share')}
        </Button>
      </section>

      {/* Настоящая последовательность из трёх шагов, поэтому она и
          пронумерована. Раздел объясняет механику, а не просто показывает
          сумму. */}
      <section className="referral-how">
        <h2 className="referral-share__label">{t('referrals.how.title')}</h2>
        <ol className="referral-how__steps">
          <li>{t('referrals.how.share')}</li>
          <li>{t('referrals.how.pay')}</li>
          <li>{t('referrals.how.reward')}</li>
        </ol>
      </section>
    </section>
  );
}
