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

  it('canonicalizes valid profile and subscription dates and defaults invalid singular dates', () => {
    const state = createInitialState();
    const valid = hydrateState(JSON.stringify({
      ...state,
      profile: { ...state.profile, registeredAt: '2026-08-12' },
      subscription: { ...state.subscription, expiresAt: '2026-09-05' },
    }), null);
    const invalid = hydrateState(JSON.stringify({
      ...state,
      profile: { ...state.profile, registeredAt: 'not-a-date' },
      subscription: { ...state.subscription, expiresAt: 'not-a-date' },
    }), null);

    expect(valid.profile.registeredAt).toBe('2026-08-12T00:00:00.000Z');
    expect(valid.subscription?.expiresAt).toBe('2026-09-05T00:00:00.000Z');
    expect(invalid.profile.registeredAt).toBe(state.profile.registeredAt);
    expect(invalid.subscription?.expiresAt).toBe(state.subscription?.expiresAt);
  });

  it('canonicalizes valid collection dates and drops malformed members at the narrowest boundary', () => {
    const state = createInitialState();
    const hydrated = hydrateState(JSON.stringify({
      ...state,
      wallet: {
        ...state.wallet,
        transactions: [
          { ...state.wallet.transactions[0], id: 'valid-transaction', date: '2026-08-12' },
          { ...state.wallet.transactions[0], id: 'invalid-transaction', date: 'not-a-date' },
        ],
      },
      tickets: [
        {
          ...state.tickets[0],
          id: 'valid-ticket',
          createdAt: '2026-08-11',
          messages: [
            { ...state.tickets[0].messages[0], id: 'valid-message', date: '2026-08-11T01:00:00Z' },
            { ...state.tickets[0].messages[0], id: 'invalid-message', date: 'not-a-date' },
          ],
        },
        { ...state.tickets[0], id: 'invalid-ticket', createdAt: 'not-a-date' },
      ],
      notifications: [
        {
          id: 'valid-notification',
          type: 'ticket-created',
          ticketId: 'valid-ticket',
          read: true,
          readAt: '2026-08-11T02:00:00Z',
          createdAt: '2026-08-11',
        },
        {
          id: 'invalid-created-at',
          type: 'ticket-created',
          ticketId: 'valid-ticket',
          read: false,
          readAt: null,
          createdAt: 'not-a-date',
        },
        {
          id: 'invalid-read-at',
          type: 'ticket-created',
          ticketId: 'valid-ticket',
          read: true,
          readAt: 'not-a-date',
          createdAt: '2026-08-11',
        },
      ],
    }), null);

    expect(hydrated.wallet.transactions).toHaveLength(1);
    expect(hydrated.wallet.transactions[0].date).toBe('2026-08-12T00:00:00.000Z');
    expect(hydrated.tickets).toEqual([{
      ...state.tickets[0],
      id: 'valid-ticket',
      createdAt: '2026-08-11T00:00:00.000Z',
      messages: [{ ...state.tickets[0].messages[0], id: 'valid-message', date: '2026-08-11T01:00:00.000Z' }],
    }]);
    expect(hydrated.notifications).toEqual([{
      id: 'valid-notification',
      type: 'ticket-created',
      ticketId: 'valid-ticket',
      read: true,
      readAt: '2026-08-11T02:00:00.000Z',
      createdAt: '2026-08-11T00:00:00.000Z',
    }]);
  });
});
