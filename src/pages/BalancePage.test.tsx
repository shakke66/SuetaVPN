import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import type { LocalAdapters } from '../adapters/contracts';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

const NOW = '2026-08-13T10:00:00.000Z';

function storedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted application state');
  return JSON.parse(raw) as AppStateV2;
}

function openBalance(
  update: (state: AppStateV2) => void = () => undefined,
  adapters?: LocalAdapters,
) {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  update(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/balance';
  return render(<App adapters={adapters ?? createLocalAdapters({
    delayMs: 0,
    now: () => NOW,
    idSource: (prefix) => `${prefix}-balance-page-test`,
  })} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('balance flow', () => {
  it('renders the vertical balance, promo, top-up and history order with history collapsed', async () => {
    openBalance();

    const current = await screen.findByRole('heading', { name: 'Текущий баланс' });
    const promo = screen.getByRole('heading', { name: 'Промокод' });
    const topUp = screen.getByRole('heading', { name: 'Пополнить баланс' });
    const history = screen.getByRole('button', { name: 'История операций' });

    expect(current.compareDocumentPosition(promo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(promo.compareDocumentPosition(topUp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topUp.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(history).toHaveAttribute('aria-expanded', 'false');
  });

  it('validates the 100–50000 range and synchronizes number and range amount inputs', async () => {
    const user = userEvent.setup();
    openBalance();

    const number = await screen.findByLabelText('Сумма пополнения');
    const range = screen.getByLabelText('Выбрать сумму ползунком');
    expect(number).toHaveValue(100);
    expect(range).toHaveValue('100');

    fireEvent.change(range, { target: { value: '420' } });
    expect(number).toHaveValue(420);
    await user.clear(number);
    await user.type(number, '760');
    expect(range).toHaveValue('760');

    await user.clear(number);
    await user.type(number, '99');
    await user.click(screen.getByRole('button', { name: /Пополнить на/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Введите сумму от 100 до 50 000 ₽');
  });

  it('offers only SBP and bank card methods without payment credential fields', async () => {
    openBalance();

    const methodGroup = await screen.findByRole('radiogroup', { name: 'Способ оплаты' });
    expect(within(methodGroup).getAllByRole('radio')).toHaveLength(2);
    expect(within(methodGroup).getByRole('radio', { name: 'СБП' })).toBeInTheDocument();
    expect(within(methodGroup).getByRole('radio', { name: 'Банковская карта' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/номер карты|card number/i)).not.toBeInTheDocument();
  });

  it('moves keyboard selection between both payment methods', async () => {
    const user = userEvent.setup();
    openBalance();

    const methodGroup = await screen.findByRole('radiogroup', { name: 'Способ оплаты' });
    const sbp = within(methodGroup).getByRole('radio', { name: 'СБП' });
    const card = within(methodGroup).getByRole('radio', { name: 'Банковская карта' });

    sbp.focus();
    await user.keyboard('{ArrowRight}');
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{Home}');
    expect(sbp).toHaveFocus();
    expect(sbp).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{End}');
    expect(card).toHaveFocus();
    expect(card).toHaveAttribute('aria-checked', 'true');
  });

  it('locks duplicate top-up submission and atomically updates balance and history', async () => {
    const localAdapters = createLocalAdapters({
      delayMs: 0,
      now: () => NOW,
      idSource: (prefix) => `${prefix}-balance-page-test`,
    });
    let releaseTopUp: () => void = () => undefined;
    const topUpGate = new Promise<void>((resolve) => { releaseTopUp = resolve; });
    let topUpCalls = 0;
    const adapters: LocalAdapters = {
      ...localAdapters,
      billing: {
        ...localAdapters.billing,
        topUp: async (...args) => {
          topUpCalls += 1;
          await topUpGate;
          return localAdapters.billing.topUp(...args);
        },
      },
    };
    openBalance((state) => { state.wallet.balance = 790; }, adapters);

    const submit = await screen.findByRole('button', { name: /Пополнить на 100/ });
    fireEvent.click(submit);
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    await waitFor(() => expect(topUpCalls).toBe(1));
    releaseTopUp();

    expect(await screen.findByRole('status')).toHaveTextContent('Баланс пополнен на 100 ₽');
    expect(screen.getByText('890 ₽')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'История операций' }));
    expect(await screen.findAllByText('Пополнение через СБП')).toHaveLength(2);
    await waitFor(() => {
      expect(storedState().wallet.balance).toBe(890);
      expect(storedState().wallet.transactions[0]).toMatchObject({
        amount: 100,
        type: 'deposit',
        id: 'transaction-balance-page-test',
      });
    });
  });

  it('shows promo success and errors from the billing command', async () => {
    const user = userEvent.setup();
    openBalance();
    const promo = await screen.findByLabelText('Введите промокод');

    await user.type(promo, 'unknown');
    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Промокод не найден');

    await user.clear(promo);
    await user.type(promo, 'sueta10');
    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Промокод применён: +100 ₽');

    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Промокод уже использован');
  });

  it('renders persisted balance and transactions after reload', async () => {
    const user = userEvent.setup();
    const first = openBalance();
    await user.click(await screen.findByRole('button', { name: /Пополнить на 100/ }));
    await screen.findByRole('status');
    first.unmount();

    render(<App adapters={createLocalAdapters({ delayMs: 0, now: () => NOW })} />);
    expect(await screen.findByText('890 ₽')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'История операций' }));
    expect(await screen.findAllByText('Пополнение через СБП')).toHaveLength(2);
  });
});
