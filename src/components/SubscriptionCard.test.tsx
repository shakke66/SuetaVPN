import { render, screen } from '@testing-library/react';
import type { Subscription } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { SubscriptionCard } from './SubscriptionCard';

const setLocale = () => undefined;

const subscription: Subscription = {
  id: 'subscription-current',
  tariffId: 'elite',
  status: 'active',
  daysLeft: 30,
  periodDays: 90,
  expiresAt: '2026-10-01T00:00:00.000Z',
  trafficUsed: 0,
  trafficLimit: 40,
  devicesUsed: 0,
  devicesLimit: 6,
  autoRenew: false,
};

function renderCard(value: Subscription) {
  return render(
    <I18nProvider locale="ru" setLocale={setLocale}>
      <SubscriptionCard subscription={value} title="Текущая подписка" />
    </I18nProvider>,
  );
}

/** Полоса должна мерить остаток от оплаченного срока, а не от условных тридцати дней. */
it('заполняет полосу на треть, когда из 90 оплаченных дней осталось 30', () => {
  renderCard(subscription);

  expect(screen.getByTestId('subscription-term-bar')).toHaveStyle({ width: '33%' });
});

it('оставляет полосу полной сразу после оплаты, когда остаток равен всему периоду', () => {
  renderCard({ ...subscription, daysLeft: 90, periodDays: 90 });

  expect(screen.getByTestId('subscription-term-bar')).toHaveStyle({ width: '100%' });
});

it('показывает знаменатель рядом с остатком, чтобы полосу можно было проверить глазами', () => {
  renderCard(subscription);

  expect(screen.getByText('из 90 дней')).toBeInTheDocument();
});

it('печатает дату окончания без канцелярского «г.» в конце', () => {
  renderCard(subscription);

  expect(screen.getByText('1 октября 2026')).toBeInTheDocument();
});

it.each([
  { daysLeft: 30, state: 'ok' },
  { daysLeft: 9, state: 'warn' },
  { daysLeft: 2, state: 'crit' },
])('помечает карточку состоянием $state на $daysLeft днях, чтобы полоса меняла цвет', ({ daysLeft, state }) => {
  const { container } = renderCard({ ...subscription, daysLeft });

  expect(container.querySelector('.subscription-card')).toHaveAttribute('data-state', state);
});
