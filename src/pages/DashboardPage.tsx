import { useRef, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { ConnectDeviceDialog } from '../components/ConnectDeviceDialog';
import { Button } from '../components/Button';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { useI18n } from '../i18n/I18nProvider';

export function DashboardPage(): JSX.Element {
  const { state } = useApp();
  const { formatMoney, t } = useI18n();
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <h1>{t('dashboard.title')}</h1>
      </div>

      <SubscriptionCard
        actions={(
          <Link className="button button--ghost" to="/subscriptions">{t('dashboard.subscription.manage')}</Link>
        )}
        subscription={state.subscription}
        title={t('dashboard.subscription.title')}
      />

      <div className="dashboard-summary-grid">
        <article className="dashboard-summary-card" data-layout="horizontal" data-testid="dashboard-balance-card">
          <div>
            <p>{t('dashboard.balance.title')}</p>
            <strong>{formatMoney(state.wallet.balance)}</strong>
          </div>
          <Link className="button button--primary" to="/balance">{t('dashboard.balance.topUp')}</Link>
        </article>
        <article className="dashboard-summary-card" data-layout="horizontal" data-testid="dashboard-referral-card">
          <div>
            <p>{t('dashboard.referral.title')}</p>
            <strong>{formatMoney(state.referral.earned)}</strong>
          </div>
          <Link className="button button--ghost" to="/referral">{t('dashboard.referral.open')}</Link>
        </article>
      </div>

      <div className="dashboard-quick-actions">
        <Button ref={connectButtonRef} onClick={() => setConnectOpen(true)} variant="primary">
          {t('dashboard.connect')}
        </Button>
        {/* При активной подписке "Продлить" ведёт туда же, куда "Управлять
            подпиской" и вкладка "Подписки", и только опускает главное действие
            ниже. Без подписки это единственный призыв к покупке на главной,
            поэтому его оставляем. */}
        {!state.subscription && (
          <Link className="button button--ghost" to="/purchase">
            {t('subscriptions.choose')}
          </Link>
        )}
      </div>

      <ConnectDeviceDialog
        onClose={() => setConnectOpen(false)}
        open={connectOpen}
        returnFocusRef={connectButtonRef}
      />
    </section>
  );
}
