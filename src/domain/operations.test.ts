import { describe, expect, it } from 'vitest';
import { createInitialState } from './state';
import {
  applyPromo,
  createTicket,
  markAllNotificationsRead,
  markNotificationRead,
  purchaseSubscription,
  replyToTicket,
  topUp,
} from './operations';
import type { AppStateV2, TicketNotification } from './types';

const NOW = '2026-08-13T10:00:00.000Z';
const fixedId = (prefix: string) => `${prefix}-fixed`;

function stateWithBalance(balance: number): AppStateV2 {
  const state = createInitialState();
  return {
    ...state,
    wallet: { balance, transactions: [] },
    subscription: null,
    tickets: [],
    notifications: [],
    appliedPromos: [],
  };
}

describe('topUp', () => {
  it.each([
    { amount: 100, method: 'sbp' as const },
    { amount: 50_000, method: 'card' as const },
  ])('accepts the $amount boundary and atomically prepends its transaction', ({ amount, method }) => {
    const state = stateWithBalance(25);
    const before = structuredClone(state);

    const result = topUp(state, { amount, method }, NOW, fixedId);

    expect(result).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'billing.topUp.success',
    });
    expect(result.state.wallet.balance).toBe(25 + amount);
    expect(result.state.wallet.transactions[0]).toMatchObject({
      id: 'transaction-fixed',
      type: 'deposit',
      amount,
      date: NOW,
      status: 'completed',
    });
    expect(state).toEqual(before);
    expect(result.state).not.toBe(state);
  });

  it.each([
    { amount: 99, code: 'AMOUNT_TOO_LOW', messageKey: 'billing.topUp.amountTooLow' },
    { amount: 50_001, code: 'AMOUNT_TOO_HIGH', messageKey: 'billing.topUp.amountTooHigh' },
  ])('rejects $amount without changing the balance or history', ({ amount, code, messageKey }) => {
    const state = stateWithBalance(25);

    const result = topUp(state, { amount, method: 'sbp' }, NOW, fixedId);

    expect(result).toMatchObject({ ok: false, code, messageKey, state });
    expect(result.state).toBe(state);
  });

  it('rejects payment methods outside the local SBP/card contract', () => {
    const state = stateWithBalance(25);

    const result = topUp(
      state,
      { amount: 100, method: 'cash' } as unknown as Parameters<typeof topUp>[1],
      NOW,
      fixedId,
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'PAYMENT_METHOD_INVALID',
      messageKey: 'billing.topUp.paymentMethodInvalid',
      state,
    });
    expect(result.state).toBe(state);
  });
});

describe('applyPromo', () => {
  it('applies SUETA10 once, normalizes its casing and credits exactly 100 roubles', () => {
    const state = stateWithBalance(10);
    const before = structuredClone(state);

    const first = applyPromo(state, ' sueta10 ', NOW, fixedId);

    expect(first).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'billing.promo.success',
    });
    expect(first.state.wallet.balance).toBe(110);
    expect(first.state.appliedPromos).toEqual(['SUETA10']);
    expect(first.state.wallet.transactions[0]).toMatchObject({
      id: 'transaction-fixed',
      type: 'promo',
      amount: 100,
      date: NOW,
      status: 'completed',
    });
    expect(state).toEqual(before);

    const second = applyPromo(first.state, 'SUETA10', NOW, fixedId);

    expect(second).toMatchObject({
      ok: false,
      code: 'PROMO_ALREADY_USED',
      messageKey: 'billing.promo.alreadyUsed',
    });
    expect(second.state).toBe(first.state);
    expect(second.state.wallet.balance).toBe(110);
    expect(second.state.wallet.transactions).toHaveLength(1);
  });
});

describe('purchaseSubscription', () => {
  it.each([
    { tariffId: 'base' as const, months: 1 as const, total: 250 },
    { tariffId: 'base' as const, months: 3 as const, total: 490 },
    { tariffId: 'base' as const, months: 6 as const, total: 940 },
    { tariffId: 'base' as const, months: 12 as const, total: 1_390 },
    { tariffId: 'elite' as const, months: 1 as const, total: 310 },
    { tariffId: 'elite' as const, months: 3 as const, total: 690 },
    { tariffId: 'elite' as const, months: 6 as const, total: 1_290 },
    { tariffId: 'elite' as const, months: 12 as const, total: 1_990 },
  ])('charges the exact catalog total $total for $tariffId/$months', ({ tariffId, months, total }) => {
    const result = purchaseSubscription(stateWithBalance(5_000), tariffId, months, NOW, fixedId);

    expect(result.ok).toBe(true);
    expect(result.state.wallet.balance).toBe(5_000 - total);
    expect(result.state.wallet.transactions[0].amount).toBe(-total);
  });

  it('returns insufficient balance with the original state completely untouched', () => {
    const state = stateWithBalance(689);
    const before = structuredClone(state);

    const result = purchaseSubscription(state, 'elite', 3, NOW, fixedId);

    expect(result).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_BALANCE',
      messageKey: 'subscriptions.purchase.insufficientBalance',
      state,
    });
    expect(result.state).toBe(state);
    expect(state).toEqual(before);
  });

  it('updates the balance, transaction, draft and new subscription in one returned state', () => {
    const state = stateWithBalance(1_000);
    const before = structuredClone(state);

    const result = purchaseSubscription(state, 'elite', 3, NOW, fixedId);

    expect(result).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'subscriptions.purchase.success',
    });
    expect(result.state.wallet.balance).toBe(310);
    expect(result.state.subscription).toEqual({
      id: 'subscription-fixed',
      tariffId: 'elite',
      status: 'active',
      daysLeft: 90,
      expiresAt: '2026-11-11T10:00:00.000Z',
      trafficUsed: 0,
      trafficLimit: 40,
      devicesUsed: 0,
      devicesLimit: 6,
    });
    expect(result.state.purchaseDraft).toEqual({ tariffId: 'elite', months: 3 });
    expect(result.state.wallet.transactions[0]).toMatchObject({
      id: 'transaction-fixed',
      type: 'purchase',
      amount: -690,
      date: NOW,
      status: 'completed',
    });
    expect(state).toEqual(before);
  });

  it('extends an active same-plan subscription from its current expiry', () => {
    const state = stateWithBalance(1_000);
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

    const result = purchaseSubscription(state, 'base', 3, NOW, fixedId);

    expect(result.ok).toBe(true);
    expect(result.state.subscription).toEqual({
      ...state.subscription,
      status: 'active',
      daysLeft: 109,
      expiresAt: '2026-11-30T10:00:00.000Z',
    });
  });

  it('changes plans immediately and resets plan-specific usage from the purchase time', () => {
    const state = stateWithBalance(1_000);
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

    const result = purchaseSubscription(state, 'elite', 1, NOW, fixedId);

    expect(result.ok).toBe(true);
    expect(result.state.subscription).toEqual({
      id: 'subscription-current',
      tariffId: 'elite',
      status: 'active',
      daysLeft: 30,
      expiresAt: '2026-09-12T10:00:00.000Z',
      trafficUsed: 0,
      trafficLimit: 40,
      devicesUsed: 0,
      devicesLimit: 6,
    });
  });
});

describe('ticket operations', () => {
  it('creates a ticket with a user message and prepends its unread ticket notification', () => {
    const state = stateWithBalance(0);
    const before = structuredClone(state);

    const result = createTicket(
      state,
      { subject: '  Не работает VPN  ', message: '  Нужна помощь  ', attachmentName: '  screen.png  ' },
      NOW,
      fixedId,
    );

    expect(result).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'tickets.create.success',
    });
    expect(result.state.tickets[0]).toEqual({
      id: 'ticket-fixed',
      subject: 'Не работает VPN',
      status: 'open',
      createdAt: NOW,
      attachmentName: 'screen.png',
      messages: [{
        id: 'message-fixed',
        author: 'user',
        text: 'Нужна помощь',
        date: NOW,
      }],
    });
    expect(result.state.notifications[0]).toEqual({
      id: 'notification-fixed',
      type: 'ticket-created',
      ticketId: 'ticket-fixed',
      read: false,
      createdAt: NOW,
    });
    expect(state).toEqual(before);
  });

  it('appends a local-user reply without creating a support notification', () => {
    const created = createTicket(
      stateWithBalance(0),
      { subject: 'Вопрос', message: 'Первое сообщение' },
      NOW,
      fixedId,
    );
    const state = created.state;
    const before = structuredClone(state);

    const result = replyToTicket(state, 'ticket-fixed', '  Дополнение  ', NOW, fixedId);

    expect(result).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'tickets.reply.success',
    });
    expect(result.state.tickets[0].status).toBe('open');
    expect(result.state.tickets[0].messages.at(-1)).toEqual({
      id: 'message-fixed',
      author: 'user',
      text: 'Дополнение',
      date: NOW,
    });
    expect(result.state.notifications).toEqual(state.notifications);
    expect(state).toEqual(before);
  });

  it.each([
    {
      run: (state: AppStateV2) => createTicket(state, { subject: ' ', message: 'Есть текст' }, NOW, fixedId),
      code: 'SUBJECT_REQUIRED',
      messageKey: 'tickets.create.subjectRequired',
    },
    {
      run: (state: AppStateV2) => createTicket(state, { subject: 'Тема', message: ' ' }, NOW, fixedId),
      code: 'MESSAGE_REQUIRED',
      messageKey: 'tickets.create.messageRequired',
    },
    {
      run: (state: AppStateV2) => replyToTicket(state, 'missing', 'Ответ', NOW, fixedId),
      code: 'TICKET_NOT_FOUND',
      messageKey: 'tickets.reply.notFound',
    },
  ])('rejects invalid ticket input with stable $code metadata', ({ run, code, messageKey }) => {
    const state = stateWithBalance(0);

    const result = run(state);

    expect(result).toMatchObject({ ok: false, code, messageKey, state });
    expect(result.state).toBe(state);
  });
});

describe('ticket notification operations', () => {
  const notifications: TicketNotification[] = [
    { id: 'notification-1', type: 'ticket-created', ticketId: 'ticket-1', read: false, createdAt: NOW },
    { id: 'notification-2', type: 'ticket-replied', ticketId: 'ticket-2', read: false, createdAt: NOW },
    { id: 'notification-3', type: 'ticket-created', ticketId: 'ticket-3', read: true, createdAt: NOW },
  ];

  it('marks only the selected ticket notification as read', () => {
    const state = { ...stateWithBalance(0), notifications };

    const result = markNotificationRead(state, 'notification-2');

    expect(result).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'notifications.markRead.success',
    });
    expect(result.state.notifications.map(({ id, read }) => ({ id, read }))).toEqual([
      { id: 'notification-1', read: false },
      { id: 'notification-2', read: true },
      { id: 'notification-3', read: true },
    ]);
    expect(state.notifications[1].read).toBe(false);
  });

  it('marks all ticket notifications read without changing their event data', () => {
    const state = { ...stateWithBalance(0), notifications };

    const result = markAllNotificationsRead(state);

    expect(result).toMatchObject({
      ok: true,
      code: 'success',
      messageKey: 'notifications.markAllRead.success',
    });
    expect(result.state.notifications).toEqual(notifications.map((notification) => ({
      ...notification,
      read: true,
    })));
    expect(state.notifications[0].read).toBe(false);
  });

  it('rejects an unknown notification without mutation', () => {
    const state = { ...stateWithBalance(0), notifications };

    const result = markNotificationRead(state, 'missing');

    expect(result).toMatchObject({
      ok: false,
      code: 'NOTIFICATION_NOT_FOUND',
      messageKey: 'notifications.markRead.notFound',
      state,
    });
    expect(result.state).toBe(state);
  });
});
