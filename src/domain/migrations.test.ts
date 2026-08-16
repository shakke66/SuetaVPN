import { describe, expect, it } from 'vitest';
import { hydrateState } from './migrations';
import { createInitialState } from './state';

describe('hydrateState', () => {
  it('returns fresh defaults for malformed persisted JSON', () => {
    const hydrated = hydrateState('{not-json', null);

    expect(hydrated).toEqual(createInitialState());
    expect(hydrated).not.toBe(createInitialState());
  });

  it('repairs missing v1 fields while persisting valid light and EN preferences', () => {
    const hydrated = hydrateState(null, JSON.stringify({
      version: 1,
      theme: 'light',
      locale: 'en',
    }));

    expect(hydrated.preferences).toEqual({
      theme: 'light',
      locale: 'en',
      onboardingCompleted: false,
    });
    expect(hydrated.wallet).toEqual(createInitialState().wallet);
  });

  it('migrates removed v1 tariff selections to base while preserving user collections', () => {
    const transaction = {
      id: 'transaction-1',
      type: 'deposit',
      amount: 500,
      description: 'Пополнение',
      date: '2026-08-12T10:00:00.000Z',
      status: 'completed',
    };
    const ticket = {
      id: 'ticket-1',
      subject: 'Нужна помощь',
      status: 'open',
      createdAt: '2026-08-12T10:00:00.000Z',
      attachmentName: '',
      messages: [{
        id: 'message-1',
        author: 'user',
        text: 'Подскажите, пожалуйста',
        date: '2026-08-12T10:00:00.000Z',
      }],
    };
    const hydrated = hydrateState(null, JSON.stringify({
      version: 1,
      balance: 500,
      selectedTariffId: 'family',
      subscription: { tariffId: 'start' },
      transactions: [transaction],
      tickets: [ticket],
      referral: {
        rewardPercent: 20,
        invited: 2,
        active: 1,
        earned: 100,
        botLink: 'https://t.me/suetavpn_bot?start=abc',
        cabinetLink: 'https://example.test/cabinet',
      },
    }));

    expect(hydrated.wallet.balance).toBe(500);
    expect(hydrated.wallet.transactions).toEqual([transaction]);
    expect(hydrated.tickets).toEqual([ticket]);
    expect(hydrated.purchaseDraft.tariffId).toBe('base');
    expect(hydrated.subscription?.tariffId).toBe('base');
    expect(hydrated.referral).toEqual({
      rewardPercent: 20,
      invited: 2,
      active: 1,
      earned: 100,
      telegramLink: 'https://t.me/suetavpn_bot?start=abc',
    });
    expect(hydrated.referral).not.toHaveProperty('cabinetLink');
  });

  it('hydrates a valid v2 payload idempotently and filters malformed collection members', () => {
    const state = createInitialState();
    const raw = JSON.stringify({
      ...state,
      preferences: { ...state.preferences, theme: 'light', locale: 'en' },
      wallet: {
        ...state.wallet,
        transactions: [
          ...state.wallet.transactions,
          { id: '', type: 'deposit', amount: 100, description: 'invalid', date: '2026-08-12T10:00:00.000Z', status: 'completed' },
        ],
      },
      tickets: [
        ...state.tickets,
        { id: 'invalid-ticket', subject: '', status: 'open', createdAt: '2026-08-12T10:00:00.000Z', messages: [] },
      ],
      notifications: [
        ...state.notifications,
        { id: 'invalid-notification', type: 'ticket-created', ticketId: '', read: false, createdAt: '2026-08-12T10:00:00.000Z' },
      ],
    });

    const first = hydrateState(raw, null);
    const second = hydrateState(JSON.stringify(first), null);

    expect(first).toEqual(second);
    expect(first.preferences).toEqual({ ...state.preferences, theme: 'light', locale: 'en' });
    expect(first.wallet.transactions).toEqual(state.wallet.transactions);
    expect(first.tickets).toEqual(state.tickets);
    expect(first.notifications).toEqual(state.notifications);
  });

  it('drops collection members with invalid ticket enum values', () => {
    const state = createInitialState();
    const hydrated = hydrateState(JSON.stringify({
      ...state,
      tickets: [
        ...state.tickets,
        { id: 'invalid-ticket-status', subject: 'Status', status: 'closed', createdAt: '2026-08-12T10:00:00.000Z', attachmentName: '', messages: [] },
        {
          id: 'invalid-message-author', subject: 'Author', status: 'open', createdAt: '2026-08-12T10:00:00.000Z', attachmentName: '',
          messages: [{ id: 'invalid-message', author: 'system', text: 'Invalid', date: '2026-08-12T10:00:00.000Z' }],
        },
      ],
      notifications: [
        ...state.notifications,
        { id: 'invalid-notification-type', type: 'subscription-expired', ticketId: 'ticket-current', read: false, createdAt: '2026-08-12T10:00:00.000Z' },
      ],
    }), null);

    expect(hydrated.tickets).toEqual([
      ...state.tickets,
      {
        id: 'invalid-message-author', subject: 'Author', status: 'open', createdAt: '2026-08-12T10:00:00.000Z', attachmentName: '', messages: [],
      },
    ]);
    expect(hydrated.notifications).toEqual(state.notifications);
  });

  it('hydrates legacy notification read booleans into persistent readAt timestamps', () => {
    const createdAt = '2026-08-12T10:00:00.000Z';
    const explicitReadAt = '2026-08-12T11:00:00.000Z';
    const state = createInitialState();
    const hydrated = hydrateState(JSON.stringify({
      ...state,
      notifications: [
        { id: 'legacy-read', type: 'ticket-created', ticketId: 'ticket-current', read: true, createdAt },
        { id: 'legacy-unread', type: 'ticket-replied', ticketId: 'ticket-current', read: false, createdAt },
        { id: 'timestamped-read', type: 'ticket-created', ticketId: 'ticket-current', read: false, readAt: explicitReadAt, createdAt },
      ],
    }), null);

    expect(hydrated.notifications).toEqual([
      { id: 'legacy-read', type: 'ticket-created', ticketId: 'ticket-current', read: true, readAt: createdAt, createdAt },
      { id: 'legacy-unread', type: 'ticket-replied', ticketId: 'ticket-current', read: false, readAt: null, createdAt },
      { id: 'timestamped-read', type: 'ticket-created', ticketId: 'ticket-current', read: true, readAt: explicitReadAt, createdAt },
    ]);
  });

  it('drops a legacy read notification when its createdAt cannot become an ISO readAt', () => {
    const state = createInitialState();
    const hydrated = hydrateState(JSON.stringify({
      ...state,
      notifications: [{
        id: 'legacy-invalid-time',
        type: 'ticket-created',
        ticketId: 'ticket-current',
        read: true,
        createdAt: 'yesterday afternoon',
      }],
    }), null);

    expect(hydrated.notifications).toEqual([]);
  });
});
