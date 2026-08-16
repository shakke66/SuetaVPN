import type { JSX, ReactNode } from 'react';
import { getTariff } from '../domain/tariffs';
import type { Subscription } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

interface SubscriptionCardProps {
  actions?: ReactNode;
  subscription: Subscription | null;
  title: string;
}

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
  const copy = subscription.tariffId === 'base' ? 'base' : 'elite';
  const traffic = tariff?.traffic.kind === 'unlimited'
    ? <span>{t('tariffs.base.traffic')}</span>
    : <>
      <span>{t('tariffs.elite.regularServers')}</span>
      <span>{t('tariffs.elite.traffic', { amount: tariff?.traffic.bypassGb ?? 40 })}</span>
    </>;

  return (
    <article className="subscription-card" data-onboarding-target="subscription">
      <div className="subscription-card__heading">
        <div>
          <h2>{title}</h2>
          <p>{t(`tariffs.${copy}.name`)}</p>
        </div>
        <span className="status-badge">{t(`common.status.${subscription.status}`)}</span>
      </div>
      <dl className="subscription-card__details">
        <div>
          <dt>{t('subscriptions.expiresAt', { amount: formatDate(subscription.expiresAt) })}</dt>
          <dd>{t('dashboard.subscription.daysLeft', { amount: subscription.daysLeft })}</dd>
        </div>
        <div>
          <dt>{t('subscriptions.devices', { amount: `${subscription.devicesUsed}/${subscription.devicesLimit}` })}</dt>
          <dd>{traffic}</dd>
        </div>
      </dl>
      {actions ? <div className="subscription-card__actions">{actions}</div> : null}
    </article>
  );
}
