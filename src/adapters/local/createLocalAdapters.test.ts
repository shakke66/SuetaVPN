import { describe, expect, it } from 'vitest';
import { createInitialState } from '../../domain/state';
import { createLocalAdapters } from './createLocalAdapters';
import type { AppStateV2 } from '../../domain/types';

const NOW = '2026-08-13T10:00:00.000Z';

function emptyState(): AppStateV2 {
  const state = createInitialState();
  return {
    ...state,
    wallet: { balance: 2_000, transactions: [] },
    subscription: null,
    tickets: [],
    notifications: [],
    appliedPromos: [],
  };
}

describe('createLocalAdapters', () => {
  const adapters = createLocalAdapters({
    delayMs: 0,
    now: () => NOW,
    idSource: (prefix) => `${prefix}-adapter`,
  });

  it('exposes promise-based billing operations with deterministic time and ids', async () => {
    const state = emptyState();
    const pending = adapters.billing.topUp(state, { amount: 100, method: 'sbp' });

    expect(pending).toBeInstanceOf(Promise);
    expect(state.wallet.balance).toBe(2_000);

    const toppedUp = await pending;
    expect(toppedUp.ok).toBe(true);
    expect(toppedUp.state.wallet.balance).toBe(2_100);
    expect(toppedUp.state.wallet.transactions[0]).toMatchObject({
      id: 'transaction-adapter',
      date: NOW,
    });

    const promo = await adapters.billing.applyPromo(toppedUp.state, 'SUETA10');
    expect(promo.ok).toBe(true);
    expect(promo.state.wallet.balance).toBe(2_200);
    expect(promo.state.appliedPromos).toEqual(['SUETA10']);
  });

  it('delegates subscription purchases through the future HTTP boundary', async () => {
    const result = await adapters.subscriptions.purchase(emptyState(), 'elite', 12);

    expect(result.ok).toBe(true);
    expect(result.state.wallet.balance).toBe(10);
    expect(result.state.subscription).toMatchObject({
      id: 'subscription-adapter',
      tariffId: 'elite',
      expiresAt: '2027-08-08T10:00:00.000Z',
    });
  });

  it('delegates ticket create/reply and notification read operations', async () => {
    const created = await adapters.tickets.create(emptyState(), {
      subject: 'Вопрос',
      message: 'Первое сообщение',
    });
    expect(created.ok).toBe(true);
    expect(created.state.tickets[0].id).toBe('ticket-adapter');
    expect(created.state.notifications[0].read).toBe(false);

    const replied = await adapters.tickets.reply(created.state, 'ticket-adapter', 'Дополнение');
    expect(replied.ok).toBe(true);
    expect(replied.state.tickets[0].messages.at(-1)?.author).toBe('user');
    expect(replied.state.notifications).toHaveLength(1);

    const marked = await adapters.notifications.markRead(replied.state, 'notification-adapter');
    expect(marked.ok).toBe(true);
    expect(marked.state.notifications[0].read).toBe(true);

    const withUnread = {
      ...marked.state,
      notifications: marked.state.notifications.map((notification) => ({ ...notification, read: false })),
    };
    const allRead = await adapters.notifications.markAllRead(withUnread);
    expect(allRead.ok).toBe(true);
    expect(allRead.state.notifications.every(({ read }) => read)).toBe(true);
  });
});
