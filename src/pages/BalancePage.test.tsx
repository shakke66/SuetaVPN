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
  it('puts the top-up form first and keeps balance, promo and open history beside it', async () => {
    openBalance();

    const topUp = await screen.findByRole('heading', { name: 'Пополнить баланс' });
    const current = screen.getByRole('heading', { name: 'Текущий баланс' });
    const promo = screen.getByRole('heading', { name: 'Промокод' });
    const history = screen.getByRole('button', { name: 'История операций' });

    expect(topUp.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(current.compareDocumentPosition(promo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(promo.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(history).toHaveAttribute('aria-expanded', 'true');
  });

  it('validates the 100–50000 range and drives the amount from presets and steppers', async () => {
    const user = userEvent.setup();
    openBalance();

    const number = await screen.findByLabelText('Сумма пополнения');
    expect(number).toHaveValue(1000);

    await user.click(screen.getByRole('button', { name: /^500\s₽$/ }));
    expect(number).toHaveValue(500);
    await user.click(screen.getByRole('button', { name: /^Увеличить на 500\s₽$/ }));
    expect(number).toHaveValue(1000);
    await user.click(screen.getByRole('button', { name: /^Уменьшить на 500\s₽$/ }));
    expect(number).toHaveValue(500);

    await user.clear(number);
    await user.type(number, '99');
    await user.click(screen.getByRole('button', { name: /Пополнить на/ }));
    expect(await screen.findByText('Введите сумму от 100 до 50 000 ₽')).toBeInTheDocument();
  });

  it('offers only SBP and bank card methods without payment credential fields', async () => {
    openBalance();

    const methodGroup = await screen.findByRole('radiogroup', { name: 'Способ оплаты' });
    expect(within(methodGroup).getAllByRole('radio')).toHaveLength(2);
    expect(within(methodGroup).getByRole('radio', { name: 'СБП' })).toBeInTheDocument();
    expect(within(methodGroup).getByRole('radio', { name: 'Банковская карта' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/номер карты|card number/i)).not.toBeInTheDocument();
  });

  it('gives each payment method its own glyph', async () => {
    openBalance();

    const methodGroup = await screen.findByRole('radiogroup', { name: 'Способ оплаты' });
    const sbp = within(methodGroup).getByRole('radio', { name: 'СБП' });
    const card = within(methodGroup).getByRole('radio', { name: 'Банковская карта' });
    const sbpGlyph = sbp.querySelector('svg.wallet-method__dot');
    const cardGlyph = card.querySelector('svg.wallet-method__dot');

    expect(sbpGlyph).not.toBeNull();
    expect(cardGlyph).not.toBeNull();
    // До 04.09 у обоих способов стоял один и тот же лаймовый кружок: он
    // повторял рамку выбранной строки и ничего не говорил о самом способе.
    expect(sbpGlyph?.innerHTML).not.toEqual(cardGlyph?.innerHTML);
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

    fireEvent.change(await screen.findByLabelText('Сумма пополнения'), { target: { value: '100' } });
    const submit = screen.getByRole('button', { name: /Пополнить на 100/ });
    fireEvent.click(submit);
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    await waitFor(() => expect(topUpCalls).toBe(1));
    releaseTopUp();

    expect(await screen.findByText('Баланс пополнен на 100 ₽')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('890 ₽')).toBeInTheDocument();
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
    expect(await screen.findByText('Промокод не найден')).toBeInTheDocument();

    await user.clear(promo);
    await user.type(promo, 'sueta10');
    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(await screen.findByText('Промокод применён: +100 ₽')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Применить' }));
    expect(await screen.findByText('Промокод уже использован')).toBeInTheDocument();
  });

  it('renders persisted balance and transactions after reload', async () => {
    const user = userEvent.setup();
    const first = openBalance();
    fireEvent.change(await screen.findByLabelText('Сумма пополнения'), { target: { value: '100' } });
    await user.click(screen.getByRole('button', { name: /Пополнить на 100/ }));
    await screen.findByText('Баланс пополнен на 100 ₽');
    first.unmount();

    render(<App adapters={createLocalAdapters({ delayMs: 0, now: () => NOW })} />);
    expect(within(await screen.findByRole('main')).getByText('890 ₽')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'История операций' }));
    expect(await screen.findAllByText('Пополнение через СБП')).toHaveLength(2);
  });
});
