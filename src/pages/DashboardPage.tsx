import { useRef, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { ConnectDeviceDialog } from '../components/ConnectDeviceDialog';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
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

      {/* Кликабельна вся плитка: кнопки внутри забирали лайм у главного
          действия экрана и делали три полосы подряд одинаковыми. */}
      <div className="dashboard-tiles">
        <Link className="dashboard-tile" data-testid="dashboard-balance-card" to="/balance">
          <span className="dashboard-tile__label">{t('dashboard.balance.title')}</span>
          <strong className="dashboard-tile__value">{formatMoney(state.wallet.balance)}</strong>
          <span className="dashboard-tile__hint">{t('dashboard.balance.hint')}</span>
          <Icon aria-hidden="true" className="dashboard-tile__chevron" name="chevron-right" size={16} />
        </Link>
        <Link className="dashboard-tile" data-testid="dashboard-referral-card" to="/referral">
          <span className="dashboard-tile__label">{t('dashboard.referral.short')}</span>
          <strong className="dashboard-tile__value">{formatMoney(state.referral.earned)}</strong>
          <span className="dashboard-tile__hint">{t('dashboard.referral.hint')}</span>
          <Icon aria-hidden="true" className="dashboard-tile__chevron" name="chevron-right" size={16} />
        </Link>
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
