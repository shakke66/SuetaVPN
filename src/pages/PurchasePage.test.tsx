import { render, screen, waitFor, within } from '@testing-library/react';
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

function openProtectedRoute(
  path: '/dashboard' | '/subscriptions' | '/purchase',
  update: (state: AppStateV2) => void = () => undefined,
  adapters?: LocalAdapters,
) {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  update(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = `#${path}`;
  const defaultAdapters = createLocalAdapters({
    delayMs: 0,
    now: () => NOW,
    idSource: (prefix) => `${prefix}-page-test`,
  });
  return render(<App adapters={adapters ?? defaultAdapters} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('dashboard and subscriptions', () => {
  it('keeps balance and referral content horizontal and explains Base traffic honestly', async () => {
    openProtectedRoute('/dashboard');

    expect(await screen.findByRole('heading', { level: 1, name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-balance-card')).toHaveAttribute('data-layout', 'horizontal');
    expect(screen.getByTestId('dashboard-referral-card')).toHaveAttribute('data-layout', 'horizontal');
    expect(screen.getByText('Безлимитный трафик')).toBeInTheDocument();
  });

  it('shows the Elite bypass allowance separately from unlimited regular servers', async () => {
    openProtectedRoute('/dashboard', (state) => {
      state.subscription = {
        id: 'subscription-elite',
        tariffId: 'elite',
        status: 'active',
        daysLeft: 25,
        expiresAt: '2026-09-07T10:00:00.000Z',
        trafficUsed: 7,
        trafficLimit: 40,
        devicesUsed: 1,
        devicesLimit: 6,
      };
    });

    expect(await screen.findByText('40 ГБ обходного трафика')).toBeInTheDocument();
    expect(screen.getByText('Обычные серверы без ограничений')).toBeInTheDocument();
  });

  it('shows only the current subscription and routes its actions to purchase', async () => {
    openProtectedRoute('/subscriptions');

    expect(await screen.findByRole('heading', { level: 1, name: 'Подписки' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Текущая подписка' })).toBeInTheDocument();
    expect(screen.queryByText('Доступные тарифы')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Продлить' })).toHaveAttribute('href', '#/purchase');
    expect(screen.getByRole('link', { name: 'Сменить тариф' })).toHaveAttribute('href', '#/purchase');
  });

  it('opens a keyboard-dismissable connection dialog and restores trigger focus', async () => {
    const user = userEvent.setup();
    openProtectedRoute('/dashboard');
    const trigger = await screen.findByRole('button', { name: 'Подключить устройство' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Подключить устройство' });
    expect(within(dialog).getByRole('button', { name: 'Закрыть окно' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Подключить устройство' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('purchase flow', () => {
  it('renders two plans and four periods and recalculates exact catalog totals', async () => {
    const user = userEvent.setup();
    openProtectedRoute('/purchase', (state) => {
      state.wallet.balance = 5_000;
      state.purchaseDraft = { tariffId: 'base', months: 1 };
    });

    const planGroup = await screen.findByRole('radiogroup', { name: 'Выбор тарифа' });
    const periodGroup = screen.getByRole('radiogroup', { name: 'Выбор периода' });
    expect(within(planGroup).getAllByRole('radio')).toHaveLength(2);
    expect(within(periodGroup).getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByTestId('purchase-total')).toHaveTextContent(/250\s₽/);

    await user.click(within(planGroup).getByRole('radio', { name: /ЭЛИТА/ }));
    await user.click(within(periodGroup).getByRole('radio', { name: '12 месяцев' }));

    expect(screen.getByTestId('purchase-total')).toHaveTextContent(/1\s990\s₽/);
    await waitFor(() => expect(storedState().purchaseDraft).toEqual({ tariffId: 'elite', months: 12 }));
  });

  it('disables duplicate submission and atomically debits the exact total on success', async () => {
    const user = userEvent.setup();
    const localAdapters = createLocalAdapters({
      delayMs: 0,
      now: () => NOW,
      idSource: (prefix) => `${prefix}-page-test`,
    });
    let releasePurchase: () => void = () => {};
    const purchaseGate = new Promise<void>((resolve) => {
      releasePurchase = resolve;
    });
    const adapters: LocalAdapters = {
      ...localAdapters,
      subscriptions: {
        purchase: async (...args) => {
          await purchaseGate;
          return localAdapters.subscriptions.purchase(...args);
        },
      },
    };
    openProtectedRoute('/purchase', (state) => {
      state.wallet.balance = 2_000;
      state.subscription = null;
      state.purchaseDraft = { tariffId: 'elite', months: 3 };
    }, adapters);
    const submit = await screen.findByRole('button', { name: 'Оформить подписку' });

    await user.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());
    releasePurchase();
    expect(await screen.findByRole('status')).toHaveTextContent('Подписка успешно оформлена');

    await waitFor(() => {
      expect(storedState().wallet.balance).toBe(1_310);
      expect(storedState().subscription).toMatchObject({ tariffId: 'elite', daysLeft: 90 });
      expect(storedState().wallet.transactions[0]).toMatchObject({ type: 'purchase', amount: -690 });
    });
  });

  it('shows the shortfall near the CTA and keeps the draft when routing to top-up', async () => {
    const user = userEvent.setup();
    openProtectedRoute('/purchase', (state) => {
      state.wallet.balance = 200;
      state.purchaseDraft = { tariffId: 'elite', months: 12 };
    });

    await user.click(await screen.findByRole('button', { name: 'Оформить подписку' }));
    const error = await screen.findByRole('alert', { name: 'Ошибка оформления подписки' });
    expect(within(error).getByRole('heading', { name: 'На балансе недостаточно средств' })).toHaveFocus();
    expect(error).toHaveTextContent(/Не хватает\s1\s790\s₽/);

    await user.click(within(error).getByRole('link', { name: 'Пополнить баланс' }));
    await waitFor(() => expect(window.location.hash).toBe('#/balance'));
    expect(storedState().purchaseDraft).toEqual({ tariffId: 'elite', months: 12 });
  });

  it('extends an active same-plan subscription from its existing expiration', async () => {
    const user = userEvent.setup();
    openProtectedRoute('/purchase', (state) => {
      state.wallet.balance = 1_000;
      state.purchaseDraft = { tariffId: 'base', months: 3 };
      state.subscription = {
        id: 'subscription-current',
        tariffId: 'base',
        status: 'active',
        daysLeft: 19,
        expiresAt: '2026-09-01T10:00:00.000Z',
        trafficUsed: 18,
        trafficLimit: 0,
        devicesUsed: 2,
        devicesLimit: 4,
      };
    });

    await user.click(await screen.findByRole('button', { name: 'Оформить подписку' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Подписка успешно оформлена');

    await waitFor(() => {
      expect(storedState().subscription).toMatchObject({
        id: 'subscription-current',
        tariffId: 'base',
        daysLeft: 109,
        expiresAt: '2026-11-30T10:00:00.000Z',
      });
    });
  });
});
