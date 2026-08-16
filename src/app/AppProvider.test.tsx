import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { Result, AppStateV2 } from '../domain/types';
import { AppProvider, useApp, type AppContextValue } from './AppProvider';

const NOW = '2026-08-13T10:00:00.000Z';
const adapters = createLocalAdapters({
  delayMs: 20,
  now: () => NOW,
  idSource: (prefix) => `${prefix}-provider`,
});

function renderProvider() {
  let current: AppContextValue | undefined;
  let mountCount = 0;

  function Probe() {
    const app = useApp();
    current = app;
    useEffect(() => {
      mountCount += 1;
    }, []);
    return null;
  }

  const view = render(<AppProvider adapters={adapters}><Probe /></AppProvider>);
  return {
    ...view,
    app: () => {
      if (!current) throw new Error('provider probe is not ready');
      return current;
    },
    mountCount: () => mountCount,
  };
}

function persisted(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted v2 state');
  return JSON.parse(raw) as AppStateV2;
}

beforeEach(() => {
  localStorage.clear();
  delete (window as Window & { Telegram?: unknown }).Telegram;
  document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppProvider hydration and preferences', () => {
  it('falls back to safe in-memory state and renders when persisted reads throw', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked storage', 'SecurityError');
    });

    const view = renderProvider();

    expect(view.app().state).toEqual(createInitialState());
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить данные в браузере');
  });

  it('hydrates v2 and applies persisted language and theme on initial mount', async () => {
    const stored = createInitialState();
    stored.preferences = { ...stored.preferences, locale: 'en', theme: 'light' };
    stored.wallet = { ...stored.wallet, balance: 4321 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const view = renderProvider();

    expect(view.app().state.wallet.balance).toBe(4321);
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });

  it('hydrates legacy state before applying its document preferences', async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({
      version: 1,
      locale: 'en',
      theme: 'light',
      balance: 345,
    }));

    const view = renderProvider();

    expect(view.app().state.wallet.balance).toBe(345);
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dataset.theme).toBe('light');
    });
  });

  it('persists locale and theme together without remounting the provider', async () => {
    const view = renderProvider();
    await waitFor(() => expect(view.mountCount()).toBe(1));

    await act(async () => {
      await view.app().setTheme('light');
      await view.app().setLocale('en');
    });

    expect(persisted().preferences).toMatchObject({ locale: 'en', theme: 'light' });
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(view.mountCount()).toBe(1);
  });
});

describe('AppProvider commands', () => {
  it('keeps a successful in-memory transition when persisted writes throw', async () => {
    const view = renderProvider();
    const before = view.app().state.wallet.balance;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    let result: Result<AppStateV2> | undefined;
    await act(async () => {
      result = await view.app().topUp({ amount: 200, method: 'sbp' });
    });

    expect(result?.ok).toBe(true);
    expect(view.app().state.wallet.balance).toBe(before + 200);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить данные в браузере');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('consumes a successful email challenge so its one-time code cannot be reused', async () => {
    const view = renderProvider();

    await act(async () => {
      await view.app().startEmail('mira@example.com');
    });
    const challenge = view.app().emailChallenge;
    expect(challenge).not.toBeNull();

    await act(async () => {
      await view.app().verifyEmail(challenge?.code ?? '');
    });

    expect(view.app().state.session.active).toBe(true);
    expect(view.app().emailChallenge).toBeNull();
  });

  it('keeps a Telegram Mini App session active when logout is invoked programmatically', async () => {
    const initial = createInitialState();
    initial.session = { active: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    (window as Window & { Telegram?: unknown }).Telegram = {
      WebApp: { initDataUnsafe: { user: { id: 42, first_name: 'Mira' } } },
    };
    const view = renderProvider();

    let result: Result<AppStateV2> | undefined;
    await act(async () => {
      result = await view.app().logout();
    });

    expect(view.app().telegramMiniApp).toBe(true);
    expect(result?.ok).toBe(true);
    expect(view.app().state.session.active).toBe(true);
    expect(persisted().session.active).toBe(true);
  });

  it('persists the complete state after a successful real domain command', async () => {
    const view = renderProvider();
    const before = view.app().state.wallet.balance;

    let result: Result<AppStateV2> | undefined;
    await act(async () => {
      result = await view.app().topUp({ amount: 200, method: 'sbp' });
    });

    expect(result?.ok).toBe(true);
    expect(view.app().state.wallet.balance).toBe(before + 200);
    expect(persisted().wallet.balance).toBe(before + 200);
    expect(persisted().wallet.transactions[0]).toMatchObject({ id: 'transaction-provider', date: NOW });
  });

  it('does not persist a failed domain command', async () => {
    const initial = createInitialState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    const view = renderProvider();
    const before = localStorage.getItem(STORAGE_KEY);

    let result: Result<AppStateV2> | undefined;
    await act(async () => {
      result = await view.app().topUp({ amount: 99, method: 'card' });
    });

    expect(result).toMatchObject({ ok: false, code: 'AMOUNT_TOO_LOW' });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
  });

  it('exposes pending names and suppresses a duplicate command with stable metadata', async () => {
    const view = renderProvider();
    let first!: Promise<Result<AppStateV2>>;
    let duplicate!: Promise<Result<AppStateV2>>;

    act(() => {
      first = view.app().topUp({ amount: 200, method: 'sbp' });
      duplicate = view.app().topUp({ amount: 300, method: 'card' });
    });

    await waitFor(() => expect(view.app().pending).toEqual(['topUp']));
    await expect(duplicate).resolves.toMatchObject({
      ok: false,
      code: 'COMMAND_PENDING',
      messageKey: 'common.commandPending',
    });
    await act(async () => { await first; });
    expect(view.app().pending).toEqual([]);
    expect(view.app().state.wallet.balance).toBe(createInitialState().wallet.balance + 200);
  });

  it('serializes different concurrent commands against the latest successful state', async () => {
    const view = renderProvider();
    const before = view.app().state.wallet.balance;
    let topUp!: Promise<Result<AppStateV2>>;
    let promo!: Promise<Result<AppStateV2>>;

    act(() => {
      topUp = view.app().topUp({ amount: 200, method: 'sbp' });
      promo = view.app().applyPromo('SUETA10');
    });

    await waitFor(() => expect(view.app().pending).toEqual(['topUp', 'applyPromo']));
    await act(async () => { await Promise.all([topUp, promo]); });

    expect(view.app().state.wallet.balance).toBe(before + 300);
    expect(view.app().state.appliedPromos).toEqual(['SUETA10']);
    expect(view.app().state.wallet.transactions.slice(0, 2).map(({ type }) => type)).toEqual(['promo', 'deposit']);
    expect(persisted().wallet.balance).toBe(before + 300);
  });

  it('retains a preference transition invoked while a domain command is running', async () => {
    const view = renderProvider();
    const before = view.app().state.wallet.balance;
    let topUp!: Promise<Result<AppStateV2>>;

    act(() => {
      topUp = view.app().topUp({ amount: 200, method: 'sbp' });
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await act(async () => { await view.app().setLocale('en'); });

    await act(async () => { await topUp; });

    expect(view.app().state.wallet.balance).toBe(before + 200);
    expect(view.app().state.preferences.locale).toBe('en');
    expect(persisted().preferences.locale).toBe('en');
  });

  it('exposes the planned preferences, billing, subscription, ticket and notification commands', () => {
    const app = renderProvider().app();
    expect([
      app.startEmail,
      app.verifyEmail,
      app.loginTelegram,
      app.logout,
      app.setTheme,
      app.setLocale,
      app.setPurchaseDraft,
      app.completeOnboarding,
      app.topUp,
      app.applyPromo,
      app.purchase,
      app.createTicket,
      app.replyTicket,
      app.markNotificationRead,
      app.markAllNotificationsRead,
    ].every((command) => typeof command === 'function')).toBe(true);
  });
});
