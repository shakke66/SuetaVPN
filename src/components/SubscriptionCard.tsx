import type { JSX, ReactNode } from 'react';
import { getTariff } from '../domain/tariffs';
import { termState, trafficState } from '../domain/term';
import type { Subscription } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

interface SubscriptionCardProps {
  /** Кнопки под карточкой: продлить, сменить тариф. */
  actions?: ReactNode;
  /** Компактное действие в шапке — там, где карточка сама ведёт на подписки. */
  manage?: ReactNode;
  subscription: Subscription | null;
  title: string;
}

export function SubscriptionCard({ actions, manage, subscription, title }: SubscriptionCardProps): JSX.Element {
  const { formatAmount, formatDay, t } = useI18n();

  if (!subscription) {
    return (
      <article className="subscription-card" data-onboarding-target="subscription">
        <h2 className="subscription-card__eyebrow">{title}</h2>
        <p className="subscription-card__empty">{t('subscriptions.empty')}</p>
        {actions ? <div className="subscription-card__actions">{actions}</div> : null}
      </article>
    );
  }

  const tariff = getTariff(subscription.tariffId);
  const copy = subscription.tariffId === 'elite' ? 'elite' : 'base';
  const bypass = tariff?.traffic.kind === 'bypass';
  // Лимит берём из подписки, а не из каталога: полоса показывает остаток человека, а не обещание тарифа.
  const trafficLeftState = trafficState(subscription.trafficUsed, subscription.trafficLimit);
  const trafficLeft = Math.max(0, Math.round((subscription.trafficLimit - subscription.trafficUsed) * 10) / 10);
  const trafficPercent = subscription.trafficLimit > 0
    ? Math.max(0, Math.min(100, Math.round((trafficLeft / subscription.trafficLimit) * 100)))
    : 0;
  // Полоса меряет остаток от оплаченного срока: у годовой подписки знаменатель 360, а не 30.
  const termPercent = Math.max(0, Math.min(100, Math.round((subscription.daysLeft / subscription.periodDays) * 100)));
  const expiresAt = formatDay(subscription.expiresAt);

  return (
    <article
      className="subscription-card"
      data-onboarding-target="subscription"
      data-state={termState(subscription)}
      data-tariff={subscription.tariffId}
    >
      <header className="subscription-card__head">
        <div className="subscription-card__head-main">
          <h2 className="subscription-card__eyebrow">{title}</h2>
          <p className="subscription-card__title">
            <span className="subscription-card__tariff">{t(`tariffs.${copy}.name`)}</span>
            <span className="subscription-card__status" data-status={subscription.status}>
              {t(`common.status.${subscription.status}`)}
            </span>
          </p>
        </div>
        {manage}
      </header>

      <dl className="subscription-card__facts">
        <div className="subscription-card__fact">
          <dt className="subscription-card__label">{t('subscriptions.card.left')}</dt>
          <dd className="subscription-card__value">
            {subscription.daysLeft}
            <span className="subscription-card__unit">
              {' '}
              {t('subscriptions.card.ofDays', { amount: subscription.periodDays })}
            </span>
          </dd>
          <div
            aria-label={t('subscriptions.card.term', { amount: subscription.daysLeft, name: subscription.periodDays })}
            className="subscription-card__term-track"
            role="img"
          >
            <span
              className="subscription-card__term-bar"
              data-testid="subscription-term-bar"
              style={{ width: `${termPercent}%` }}
            />
          </div>
        </div>

        <div className="subscription-card__fact">
          <dt className="subscription-card__label">{t('subscriptions.card.until')}</dt>
          <dd className="subscription-card__value subscription-card__value--date">
            {expiresAt}
          </dd>
        </div>

        <div className="subscription-card__fact">
          <dt className="subscription-card__label">{t('subscriptions.card.devices')}</dt>
          <dd className="subscription-card__value">
            {subscription.devicesUsed}
            <span className="subscription-card__unit">
              {' '}
              {t('subscriptions.card.ofLimit', { amount: subscription.devicesLimit })}
            </span>
          </dd>
        </div>

        <div className="subscription-card__fact" data-traffic-state={trafficLeftState ?? undefined}>
          <dt className="subscription-card__label">
            {bypass ? t('subscriptions.card.trafficBypass') : t('subscriptions.card.traffic')}
          </dt>
          <dd className="subscription-card__value">
            {trafficLeftState ? (
              <>
                {formatAmount(trafficLeft)}
                <span className="subscription-card__unit">
                  {' '}
                  {t('subscriptions.card.ofGb', { amount: subscription.trafficLimit })}
                </span>
              </>
            ) : (
              t('subscriptions.card.unlimited')
            )}
          </dd>
          {trafficLeftState ? (
            <div
              aria-label={t('subscriptions.card.trafficLeft', {
                amount: formatAmount(trafficLeft), name: subscription.trafficLimit,
              })}
              className="subscription-card__traffic-track"
              role="img"
            >
              {trafficPercent > 0 ? (
                <span
                  className="subscription-card__traffic-bar"
                  data-testid="subscription-traffic-bar"
                  style={{ width: `${trafficPercent}%` }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </dl>

      {actions ? <div className="subscription-card__actions">{actions}</div> : null}
    </article>
  );
}
