import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applyPromo, purchaseSubscription, topUp } from '../domain/operations';
import { createInitialState } from '../domain/state';
import type { Transaction } from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';
import { TransactionHistory } from './TransactionHistory';

const setLocale = () => undefined;

function renderHistory(transactions: readonly Transaction[]) {
  return render(
    <I18nProvider locale="en" setLocale={setLocale}>
      <TransactionHistory transactions={transactions} />
    </I18nProvider>,
  );
}

it('renders structured initial transaction descriptions in English without persisted Russian copy', async () => {
  const user = userEvent.setup();
  renderHistory(createInitialState().wallet.transactions);

  await user.click(screen.getByRole('button', { name: 'Transaction history' }));

  expect(screen.getByText('BASE subscription · 1 mo.')).toBeInTheDocument();
  expect(screen.getByText('Top-up via SBP')).toBeInTheDocument();
  expect(screen.queryByText(/Подписка|Пополнение/)).not.toBeInTheDocument();
});

it('renders localized generic descriptions for legacy transactions without presentation metadata', async () => {
  const user = userEvent.setup();
  const legacy = createInitialState().wallet.transactions.map(({
    months: _months,
    paymentMethod: _paymentMethod,
    tariffId: _tariffId,
    ...transaction
  }) => transaction);
  renderHistory(legacy);

  await user.click(screen.getByRole('button', { name: 'Transaction history' }));

  expect(screen.getByText('Subscription purchase')).toBeInTheDocument();
  expect(screen.getByText('Balance top-up')).toBeInTheDocument();
});

it('localizes structured top-up, promo and purchase transaction descriptions in English', async () => {
  const user = userEvent.setup();
  const initial = createInitialState();
  initial.wallet = { balance: 5_000, transactions: [] };
  const toppedUp = topUp(initial, { amount: 200, method: 'sbp' }, '2026-08-13T10:00:00.000Z');
  const promoted = applyPromo(toppedUp.state, 'SUETA10', '2026-08-13T10:01:00.000Z');
  const purchased = purchaseSubscription(promoted.state, 'elite', 3, '2026-08-13T10:02:00.000Z');

  renderHistory(purchased.state.wallet.transactions);
  await user.click(screen.getByRole('button', { name: 'Transaction history' }));

  expect(screen.getByText('Top-up via SBP')).toBeInTheDocument();
  expect(screen.getByText('Promo code bonus')).toBeInTheDocument();
  expect(screen.getByText('ELITE subscription · 3 mo.')).toBeInTheDocument();
  expect(screen.queryByText(/Подписка|Пополнение|Бонус/)).not.toBeInTheDocument();
});
