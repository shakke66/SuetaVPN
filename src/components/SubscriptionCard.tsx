import type { JSX, ReactNode } from 'react';
import { getTariff } from '../domain/tariffs';
import type { Subscription } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

interface SubscriptionCardProps {
  actions?: ReactNode;
  subscription: Subscription | null;
  title: string;
}

/** Полоса показывает остаток относительно месяца: 24 дня из 30 — это 80%. */
const TERM_SCALE_DAYS = 30;

export function SubscriptionCard({ actions, subscription, title }: SubscriptionCardProps): JSX.Element {
  const { formatDate, t } = useI18n();

  if (!subscription) {
    return (
      <article className="subscription-card" data-onboarding-target="subscription">
        <h2>{title}</h2>
        <p className="subscription-card__empty">{t('subscriptions.empty')}</p>
        {actions ? <div className="subscription-card__actions">{actions}</div> : null}
      </article>
    );
  }

  const tariff = getTariff(subscription.tariffId);
  const copy = subscription.tariffId === 'elite' ? 'elite' : 'base';
  const termPercent = Math.max(4, Math.min(100, Math.round((subscription.daysLeft / TERM_SCALE_DAYS) * 100)));

  return (
    <article className="subscription-card" data-onboarding-target="subscription">
      <div className="subscription-card__top">
        <h2>{title}</h2>
        <span className="subscription-card__plan" data-tariff={subscription.tariffId}>
          {t(`tariffs.${copy}.name`)}
        </span>
        <span className="status-badge">{t(`common.status.${subscription.status}`)}</span>
      </div>

      <div className="subscription-card__term">
        <p className="subscription-card__days">
          <strong>{subscription.daysLeft}</strong>
          <span className="subscription-card__days-unit">{t('subscriptions.daysUnit')}</span>
          <span className="subscription-card__days-caption">{t('subscriptions.daysLeftCaption')}</span>
        </p>
        <div className="subscription-card__progress">
          <span>{t('subscriptions.expiresAt', { amount: formatDate(subscription.expiresAt) })}</span>
          <span
            aria-hidden="true"
            className="subscription-card__track"
            data-tariff={subscription.tariffId}
          >
            <span className="subscription-card__bar" style={{ width: `${termPercent}%` }} />
          </span>
        </div>
      </div>

      <p className="subscription-card__facts">
        <span>
          {t('subscriptions.devices', { amount: '' }).replace(/[:：]\s*$/, '').trim()}{' '}
          <strong>{subscription.devicesUsed}/{subscription.devicesLimit}</strong>
        </span>
        <span aria-hidden="true" className="subscription-card__dot">·</span>
        {tariff?.traffic.kind === 'bypass' ? (
          <>
            <span className="subscription-card__fact-extra">
              <strong>{t('tariffs.elite.regularServers')}</strong>
              <span aria-hidden="true" className="subscription-card__dot">·</span>
            </span>
            <strong className="subscription-card__fact-wide">
              {t('tariffs.elite.traffic', { amount: tariff.traffic.bypassGb })}
            </strong>
            <strong className="subscription-card__fact-compact">
              {t('tariffs.elite.trafficShort', { amount: tariff.traffic.bypassGb })}
            </strong>
          </>
        ) : (
          <strong>{t('tariffs.base.traffic')}</strong>
        )}
      </p>

      {actions ? <div className="subscription-card__actions">{actions}</div> : null}
    </article>
  );
}
