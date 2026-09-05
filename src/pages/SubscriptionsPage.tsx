import { useState, type JSX, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { periodKey, useIsMobile } from '../app/ui';
import { DeviceRow } from '../components/DeviceRow';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { getPrice, getTariff } from '../domain/tariffs';
import type { Device, Subscription, Transaction } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

/** Полоса остатка считается так же, как в карточке подписки: 24 дня из 30 — 80%. */

type Tab = 'plan' | 'devices' | 'history';

export function SubscriptionsPage(): JSX.Element {
  const { setAutoRenew, state } = useApp();
  const { formatDate, formatMoney, t } = useI18n();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('plan');

  const subscription = state.subscription;
  const devices = state.devices;
  const history = state.wallet.transactions.filter((item) => item.type === 'purchase');

  const actions = subscription ? (
    <>
      <Link className="button button--primary" to="/purchase">{t('subscriptions.renew')}</Link>
      <Link className="button button--ghost" to="/purchase">{t('subscriptions.changeTariff')}</Link>
    </>
  ) : (
    <Link className="button button--primary" to="/purchase">{t('subscriptions.choose')}</Link>
  );

  if (!subscription) {
    return (
      <section className="subscriptions-page">
        <div className="page-heading"><h1>{t('subscriptions.title')}</h1></div>
        <SubscriptionCard actions={actions} subscription={null} title={t('subscriptions.current')} />
      </section>
    );
  }

  const tariff = getTariff(subscription.tariffId);
  const copy = subscription.tariffId === 'elite' ? 'elite' : 'base';
  const renewalPrice = getPrice(subscription.tariffId, 1) ?? 0;
  const trafficValue = tariff?.traffic.kind === 'bypass'
    ? t('subscriptions.trafficBypass', { amount: tariff.traffic.bypassGb })
    : t('subscriptions.trafficUnlimited');

  const renewLine = subscription.autoRenew
    ? t('subscriptions.autoRenew.on', {
      amount: formatMoney(renewalPrice),
      balance: formatMoney(state.wallet.balance),
      date: formatDate(subscription.expiresAt),
    })
    : t('subscriptions.autoRenew.off', { date: formatDate(subscription.expiresAt) });

  const renewShort = subscription.autoRenew
    ? t('subscriptions.autoRenew.onShort', {
      amount: formatMoney(renewalPrice),
      date: formatDate(subscription.expiresAt),
    })
    : t('subscriptions.autoRenew.offShort');

  const devicesCounter = t('subscriptions.devicesConnected', {
    amount: `${subscription.devicesUsed}/${subscription.devicesLimit}`,
  });

  const renewSwitch = (
    <button
      aria-checked={subscription.autoRenew}
      className="auto-renew__switch"
      onClick={() => void setAutoRenew(!subscription.autoRenew)}
      role="switch"
      type="button"
    >
      <span aria-hidden="true" className="auto-renew__knob" />
      <span className="visually-hidden">{t('subscriptions.autoRenew.title')}</span>
    </button>
  );

  const deviceList = devices.length > 0 ? (
    <ul className="device-list">
      {devices.map((device) => <DeviceRow device={device} key={device.id} />)}
    </ul>
  ) : (
    <p className="subscriptions-empty">{t('subscriptions.devicesEmpty')}</p>
  );

  const historyList = history.length > 0 ? (
    <ul className="subscription-history">
      {history.map((item) => <HistoryRow key={item.id} transaction={item} />)}
    </ul>
  ) : (
    <p className="subscriptions-empty">{t('subscriptions.history.empty')}</p>
  );

  if (isMobile) {
    return (
      <section className="subscriptions-page subscriptions-mobile">
        <SubscriptionCard subscription={subscription} title={t('subscriptions.current')} />

        <div aria-label={t('subscriptions.tabs.label')} className="wallet-tabs" role="tablist">
          {(['plan', 'devices', 'history'] as const).map((item) => (
            <button
              aria-selected={tab === item}
              key={item}
              onClick={() => setTab(item)}
              role="tab"
              type="button"
            >
              {t(`subscriptions.tabs.${item}`)}
            </button>
          ))}
        </div>

        <div className="subscriptions-mobile__body">
          {tab === 'plan' ? (
            <>
              <dl className="subscription-facts">
                <Fact label={t('subscriptions.facts.expires')} value={formatDate(subscription.expiresAt)} />
                <Fact
                  label={t('subscriptions.facts.devices')}
                  value={`${subscription.devicesUsed}/${subscription.devicesLimit}`}
                />
                <Fact label={t('subscriptions.facts.traffic')} value={trafficValue} />
              </dl>
              <div className="auto-renew auto-renew--inline">
                <span className="auto-renew__text">
                  <strong>{t('subscriptions.autoRenew.title')}</strong>
                  <span>{renewShort}</span>
                </span>
                {renewSwitch}
              </div>
              <Link className="button button--ghost" to="/purchase">{t('subscriptions.changeTariff')}</Link>
            </>
          ) : null}

          {tab === 'devices' ? (
            <>
              <span className="subscriptions-counter">{devicesCounter}</span>
              {deviceList}
              <Link className="button button--ghost" to="/dashboard">{t('subscriptions.connectDevice')}</Link>
            </>
          ) : null}

          {tab === 'history' ? historyList : null}
        </div>

        <div className="subscriptions-mobile__action">
          <Link className="button button--primary" to="/purchase">{t('subscriptions.renew')}</Link>
          <p className="subscriptions-mobile__hint">{renewLine}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="subscriptions-page">
      <div className="page-heading"><h1>{t('subscriptions.title')}</h1></div>

      <div className="subscriptions-layout">
        <div className="subscriptions-main">
          <SubscriptionCard actions={actions} subscription={subscription} title={t('subscriptions.current')} />

          <section aria-labelledby="subscription-devices-title" className="subscription-card devices-card">
            <div className="devices-card__head">
              <h2 id="subscription-devices-title">{t('subscriptions.devicesTitle')}</h2>
              <span className="subscriptions-counter">{devicesCounter}</span>
              <Link className="button button--ghost" to="/dashboard">{t('subscriptions.connectDevice')}</Link>
            </div>
            {deviceList}
          </section>
        </div>

        <div className="subscriptions-aside">
          <section aria-labelledby="subscription-renew-title" className="subscription-card auto-renew">
            <div className="auto-renew__head">
              <h2 id="subscription-renew-title">{t('subscriptions.autoRenew.title')}</h2>
              {renewSwitch}
            </div>
            <p className="auto-renew__line">{renewLine}</p>
          </section>

          <section aria-labelledby="subscription-history-title" className="subscription-card">
            <h2 id="subscription-history-title">{t('subscriptions.history.title')}</h2>
            {historyList}
          </section>
        </div>
      </div>
    </section>
  );
}

function HistoryRow({ transaction }: { transaction: Transaction }): JSX.Element {
  const { formatDate, formatMoney, t } = useI18n();
  const copy = transaction.tariffId === 'elite' ? 'elite' : 'base';
  const plan = transaction.months
    ? t('subscriptions.history.row', {
      amount: t(`tariffs.period.${periodKey(transaction.months)}`),
      tariff: t(`tariffs.${copy}.name`),
    })
    : t(`tariffs.${copy}.name`);

  return (
    <li className="subscription-history__row">
      <span className="subscription-history__plan">
        <span>{plan}</span>
        <span>{formatDate(transaction.date)}</span>
      </span>
      <span className="subscription-history__price">{formatMoney(Math.abs(transaction.amount))}</span>
    </li>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <div className="subscription-facts__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
