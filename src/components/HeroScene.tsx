import type { JSX } from 'react';
import { useApp } from '../app/AppProvider';
import { getTariff } from '../domain/tariffs';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import logo from '../assets/suetavpn-logo.png';
import { Icon, type IconName } from './Icon';

const TABS = [
  ['dashboard', 'navigation.dashboard'],
  ['subscriptions', 'navigation.subscriptions'],
  ['balance', 'navigation.balance'],
  ['referral', 'navigation.referrals'],
  ['support', 'navigation.support'],
] as const satisfies ReadonlyArray<readonly [IconName, MessageKey]>;

/**
 * Первый экран лендинга: телефон с экраном кабинета.
 *
 * Один прогон при загрузке — телефон выезжает снизу, содержимое проявляется
 * по очереди. Повторов нет, при `prefers-reduced-motion` движение отключается.
 */
export function HeroScene(): JSX.Element {
  const { state } = useApp();
  const { formatDate, formatMoney, t } = useI18n();

  const subscription = state.subscription;
  const tariffId = subscription?.tariffId === 'elite' ? 'elite' : 'base';
  const tariff = getTariff(tariffId);

  // Подписи вида «Устройства: {amount}» переиспользуются как заголовки без значения.
  const label = (key: MessageKey) => t(key, { amount: '' }).replace(/[:：]\s*$/, '').trim();

  const status = subscription
    ? t(subscription.status === 'active' ? 'common.status.active' : 'common.status.expired')
    : t('common.empty');

  const traffic = tariff?.traffic.kind === 'bypass'
    ? t('tariffs.elite.traffic', { amount: tariff.traffic.bypassGb })
    : t('tariffs.base.traffic');

  const trafficUsed = subscription?.trafficUsed ?? 0;
  const trafficLimit = subscription?.trafficLimit ?? 0;
  const trafficPercent = trafficLimit > 0
    ? Math.min(100, Math.round((trafficUsed / trafficLimit) * 100))
    : Math.min(100, Math.round(trafficUsed));
  const trafficTitle = label('subscriptions.traffic');

  return (
    <div className="hj">
      <div className="hj-phone">
        <div className="hj-phone__body">
          <div className="hj-phone__screen">
            <div aria-hidden="true" className="hj-phone__notch" />

            <div className="hj-brand">
              <img alt="" aria-hidden="true" src={logo} />
              <strong>{t('app.name')}</strong>
              <span>cabinet.suetavpn</span>
            </div>

            <div className="hj-screen-item preview-welcome">
              <div>
                <span className="preview-welcome__kicker">{t('landing.trust.title')}</span>
                <strong>{t('landing.trust.secure')}</strong>
              </div>
              <img alt="" aria-hidden="true" className="preview-avatar" src={logo} />
            </div>

            <div className="hj-screen-item preview-subscription">
              <div className="preview-subscription__top">
                <span className="preview-status">{status}</span>
                <span>
                  {subscription ? t('common.days', { amount: subscription.daysLeft }) : t('common.empty')}
                </span>
              </div>
              <h2>{t(`tariffs.${tariffId}.name`)}</h2>
              <p>
                {subscription
                  ? t('subscriptions.expiresAt', { amount: formatDate(subscription.expiresAt) })
                  : t('subscriptions.empty')}
              </p>
              <div className="preview-progress">
                <div className="preview-progress__labels">
                  <span>{trafficTitle}</span>
                  <strong>{traffic}</strong>
                </div>
                <div
                  aria-label={trafficTitle}
                  aria-valuemax={trafficLimit > 0 ? trafficLimit : 100}
                  aria-valuemin={0}
                  aria-valuenow={trafficUsed}
                  aria-valuetext={traffic}
                  className="preview-progress__track"
                  role="progressbar"
                >
                  <span className="preview-progress__bar" style={{ width: `${trafficPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="hj-screen-item preview-stats">
              <div className="preview-stat">
                <span>{t('dashboard.balance.title')}</span>
                <strong>{formatMoney(state.wallet.balance)}</strong>
              </div>
              <div className="preview-stat">
                <span>{label('subscriptions.devices')}</span>
                <strong>
                  {subscription
                    ? `${subscription.devicesUsed} / ${subscription.devicesLimit}`
                    : t('common.empty')}
                </strong>
              </div>
            </div>

            <div className="hj-screen-item hj-facts">
              <span className="hj-fact">
                {t(`tariffs.${tariffId}.locations`, { amount: tariff?.locations ?? 0 })}
              </span>
              <span className="hj-fact">
                {t(`tariffs.${tariffId}.speed`, { amount: tariff?.speedGbps ?? 0 })}
              </span>
              <span className="hj-fact">
                {t(`tariffs.${tariffId}.devices`, { amount: tariff?.devices ?? 0 })}
              </span>
            </div>

            <div className="hj-tabs">
              {TABS.map(([icon, titleKey], index) => (
                <span className="hj-tab" data-active={index === 0} key={icon}>
                  <Icon name={icon} size={18} />
                  <em>{t(titleKey)}</em>
                </span>
              ))}
            </div>

            <span aria-hidden="true" className="hj-phone__glare" />
          </div>
        </div>
      </div>
    </div>
  );
}
