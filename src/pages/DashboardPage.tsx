import { useRef, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { ConnectDeviceDialog } from '../components/ConnectDeviceDialog';
import { DeviceRow } from '../components/DeviceRow';
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

      {/* Главный экран VPN-кабинета отвечает на вопрос "что у меня подключено",
          а не только "сколько осталось дней". До этого от устройств здесь был
          один счётчик в карточке подписки. */}
      {state.subscription ? (
        <section className="dashboard-devices">
          <header className="dashboard-devices__header">
            <h2>{t('subscriptions.tabs.devices')}</h2>
            <span className="dashboard-devices__counter">
              {t('subscriptions.devicesConnected', {
                amount: `${state.subscription.devicesUsed}/${state.subscription.devicesLimit}`,
              })}
            </span>
          </header>
          {state.devices.length > 0 ? (
            <ul className="device-list">
              {state.devices.slice(0, 3).map((device) => <DeviceRow device={device} key={device.id} />)}
            </ul>
          ) : (
            <p className="dashboard-devices__empty">{t('subscriptions.devicesEmpty')}</p>
          )}
          {/* Действие стоит рядом с тем, к чему относится, а не отдельным
              блоком под всем экраном. */}
          <Button ref={connectButtonRef} onClick={() => setConnectOpen(true)} variant="primary">
            {t('dashboard.connect')}
          </Button>
        </section>
      ) : null}

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

      {/* Без подписки на главной нет ни устройств, ни действия с ними, поэтому
          остаётся единственный призыв: выбрать тариф. */}
      {!state.subscription && (
        <div className="dashboard-quick-actions">
          <Button ref={connectButtonRef} onClick={() => setConnectOpen(true)} variant="primary">
            {t('dashboard.connect')}
          </Button>
          <Link className="button button--ghost" to="/purchase">
            {t('subscriptions.choose')}
          </Link>
        </div>
      )}

      <ConnectDeviceDialog
        onClose={() => setConnectOpen(false)}
        open={connectOpen}
        returnFocusRef={connectButtonRef}
      />
    </section>
  );
}
