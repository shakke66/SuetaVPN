import { Button, SubscriptionCard } from 'suetavpn';

const base = {
  id: 'subscription-base',
  tariffId: 'base',
  status: 'active',
  daysLeft: 24,
  expiresAt: '2026-09-14T00:00:00.000Z',
  trafficUsed: 38.4,
  trafficLimit: 0,
  devicesUsed: 2,
  devicesLimit: 4,
} as const;

const elite = {
  id: 'subscription-elite',
  tariffId: 'elite',
  status: 'active',
  daysLeft: 312,
  expiresAt: '2027-06-28T00:00:00.000Z',
  trafficUsed: 12.7,
  trafficLimit: 40,
  devicesUsed: 5,
  devicesLimit: 6,
} as const;

const expired = {
  ...base,
  id: 'subscription-expired',
  status: 'expired',
  daysLeft: 0,
  expiresAt: '2026-08-02T00:00:00.000Z',
} as const;

/** Действующая подписка БАЗА: безлимитный трафик, до четырёх устройств. */
export const Base = () => (
  <SubscriptionCard
    actions={<Button variant="ghost">Управлять подпиской</Button>}
    subscription={base}
    title="Текущая подписка"
  />
);

/** ЭЛИТА: обычные серверы без ограничений плюс месячная квота обхода. */
export const Elite = () => (
  <SubscriptionCard
    actions={(
      <>
        <Button variant="primary">Продлить</Button>
        <Button variant="ghost">Сменить тариф</Button>
      </>
    )}
    subscription={elite}
    title="Текущая подписка"
  />
);

/** Срок закончился — статус меняется, действие зовёт продлить. */
export const Expired = () => (
  <SubscriptionCard
    actions={<Button variant="primary">Продлить</Button>}
    subscription={expired}
    title="Текущая подписка"
  />
);

/** Подписки нет: карточка показывает пустое состояние и одно действие. */
export const Empty = () => (
  <SubscriptionCard
    actions={<Button variant="primary">Выбрать тариф</Button>}
    subscription={null}
    title="Текущая подписка"
  />
);
