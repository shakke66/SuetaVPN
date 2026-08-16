import type { JSX } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { useI18n } from '../i18n/I18nProvider';

export function SubscriptionsPage(): JSX.Element {
  const { state } = useApp();
  const { t } = useI18n();
  const hasSubscription = state.subscription !== null;

  return (
    <section className="subscriptions-page">
      <div className="page-heading">
        <h1>{t('subscriptions.title')}</h1>
      </div>
      <SubscriptionCard
        actions={hasSubscription ? (
          <>
            <Link className="button button--primary" to="/purchase">{t('subscriptions.renew')}</Link>
            <Link className="button button--ghost" to="/purchase">{t('subscriptions.changeTariff')}</Link>
          </>
        ) : (
          <Link className="button button--primary" to="/purchase">{t('subscriptions.choose')}</Link>
        )}
        subscription={state.subscription}
        title={t('subscriptions.current')}
      />
    </section>
  );
}
