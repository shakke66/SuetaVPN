const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../mvp-core.js');

const NOW = '2026-08-11T10:00:00.000Z';

test('createInitialState returns an isolated usable demo state', () => {
  const first = core.createInitialState();
  const second = core.createInitialState();

  assert.equal(first.version, 1);
  assert.equal(first.balance, 790);
  assert.equal(first.theme, 'dark');
  assert.equal(first.sessionActive, false);
  assert.equal(first.subscription.tariffId, 'base');
  assert.equal(first.tariffs.length, 4);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.transactions, second.transactions);
});

test('hydrateState restores defaults when stored JSON is malformed', () => {
  const restored = core.hydrateState('{broken');

  assert.equal(restored.balance, 790);
  assert.equal(restored.profile.email, '');
  assert.equal(restored.transactions.length, 2);
});

test('hydrateState keeps valid user values and repairs missing nested fields', () => {
  const restored = core.hydrateState(JSON.stringify({
    version: 1,
    balance: 1234,
    theme: 'light',
    profile: { email: 'demo@example.com' },
    notifications: { news: false },
  }));

  assert.equal(restored.balance, 1234);
  assert.equal(restored.theme, 'light');
  assert.equal(restored.profile.email, 'demo@example.com');
  assert.equal(restored.profile.name, 'Алексей');
  assert.equal(restored.notifications.news, false);
  assert.equal(restored.notifications.subscription, true);
});

test('hydrateState repairs invalid nested scalar types before rendering', () => {
  const restored = core.hydrateState(JSON.stringify({
    version: 1,
    profile: {
      name: null,
      username: { value: '@broken' },
      role: 7,
      email: 'demo@example.com',
      emailVerified: 'yes',
      registeredAt: [],
    },
    notifications: { news: 'false', promo: false },
    subscription: {
      tariffId: '<img src=x onerror=alert(1)>',
      daysLeft: -5,
      trafficUsed: '38.4',
      trafficLimit: 0,
      devicesUsed: null,
      devicesLimit: '5',
    },
    referral: {
      rewardPercent: '20',
      invited: -3,
      active: null,
      earned: '1480',
      botLink: null,
    },
  }));

  assert.equal(restored.profile.name, 'Алексей');
  assert.equal(restored.profile.username, '@sueta_demo');
  assert.equal(restored.profile.role, 'Пользователь');
  assert.equal(restored.profile.email, 'demo@example.com');
  assert.equal(restored.profile.emailVerified, false);
  assert.equal(restored.profile.registeredAt, '11 августа 2026');
  assert.equal(restored.notifications.news, true);
  assert.equal(restored.notifications.promo, false);
  assert.equal(restored.subscription.tariffId, 'base');
  assert.equal(restored.subscription.daysLeft, 24);
  assert.equal(restored.subscription.trafficUsed, 38.4);
  assert.equal(restored.subscription.trafficLimit, 100);
  assert.equal(restored.subscription.devicesUsed, 2);
  assert.equal(restored.subscription.devicesLimit, 5);
  assert.equal(restored.referral.rewardPercent, 20);
  assert.equal(restored.referral.invited, 8);
  assert.equal(restored.referral.active, 5);
  assert.equal(restored.referral.earned, 1480);
  assert.equal(restored.referral.botLink, 'https://example.com/suetavpn-demo/bot?ref=DEMO2026');
});

test('hydrateState drops malformed collection entries and normalizes valid ones', () => {
  const restored = core.hydrateState(JSON.stringify({
    version: 1,
    transactions: [
      null,
      { id: 'bad-amount', type: 'deposit', amount: '100', description: 'bad', date: NOW },
      { id: 'valid-deposit', type: 'deposit', amount: 250, description: '<b>Демо</b>', date: NOW, status: 'completed' },
    ],
    tickets: [
      { id: 'broken-ticket', subject: null, messages: 'not-an-array' },
      {
        id: 'valid-ticket',
        subject: '<img src=x onerror=alert(1)>',
        status: 'open',
        createdAt: NOW,
        attachmentName: 'screen.png',
        messages: [
          null,
          { id: 'valid-message', author: 'user', text: '<script>alert(1)</script>', date: NOW },
        ],
      },
    ],
  }));

  assert.equal(restored.transactions.length, 1);
  assert.equal(restored.transactions[0].id, 'valid-deposit');
  assert.equal(restored.transactions[0].amount, 250);
  assert.equal(restored.transactions[0].description, '<b>Демо</b>');
  assert.equal(restored.tickets.length, 1);
  assert.equal(restored.tickets[0].id, 'valid-ticket');
  assert.equal(restored.tickets[0].messages.length, 1);
  assert.equal(restored.tickets[0].messages[0].text, '<script>alert(1)</script>');
});

test('topUp rejects amounts below 100 rubles without changing state', () => {
  const before = core.createInitialState();
  const result = core.topUp(before, 99, 'СБП', NOW);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'AMOUNT_TOO_LOW');
  assert.strictEqual(result.state, before);
  assert.equal(before.balance, 790);
});

test('topUp rejects amounts above 50000 rubles', () => {
  const result = core.topUp(core.createInitialState(), 50001, 'Карта', NOW);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'AMOUNT_TOO_HIGH');
});

test('topUp accepts boundary amounts and does not mutate its input', () => {
  const before = core.createInitialState();
  const result = core.topUp(before, 100, 'СБП', NOW);

  assert.equal(result.ok, true);
  assert.equal(result.state.balance, 890);
  assert.equal(before.balance, 790);
  assert.equal(result.state.transactions.length, 3);
  assert.equal(result.state.transactions[0].amount, 100);
  assert.equal(result.state.transactions[0].type, 'deposit');
  assert.equal(result.state.transactions[0].date, NOW);
});

test('applyPromo accepts SUETA10 once regardless of letter case and whitespace', () => {
  const first = core.applyPromo(core.createInitialState(), ' sueta10 ', NOW);
  const second = core.applyPromo(first.state, 'SUETA10', NOW);

  assert.equal(first.ok, true);
  assert.equal(first.state.balance, 890);
  assert.deepEqual(first.state.appliedPromos, ['SUETA10']);
  assert.equal(first.state.transactions[0].type, 'promo');
  assert.equal(second.ok, false);
  assert.equal(second.code, 'PROMO_ALREADY_USED');
  assert.strictEqual(second.state, first.state);
});

test('applyPromo rejects an unknown code', () => {
  const result = core.applyPromo(core.createInitialState(), 'NOTREAL', NOW);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'PROMO_NOT_FOUND');
});

test('calculatePrice applies the period discount and returns a hand-checked total', () => {
  const quote = core.calculatePrice(core.createInitialState(), 'base', 3);

  assert.equal(quote.ok, true);
  assert.equal(quote.monthlyPrice, 249);
  assert.equal(quote.discountPercent, 5);
  assert.equal(quote.total, 710);
});

test('purchase rejects an unknown tariff and unsupported period', () => {
  const state = core.createInitialState();
  const unknownTariff = core.purchase(state, 'missing', 1, NOW);
  const invalidPeriod = core.purchase(state, 'base', 2, NOW);

  assert.equal(unknownTariff.code, 'TARIFF_NOT_FOUND');
  assert.equal(invalidPeriod.code, 'PERIOD_NOT_SUPPORTED');
  assert.strictEqual(unknownTariff.state, state);
  assert.strictEqual(invalidPeriod.state, state);
});

test('purchase reports insufficient funds without changing the subscription', () => {
  const before = core.createInitialState();
  const result = core.purchase(before, 'family', 12, NOW);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_BALANCE');
  assert.equal(result.required, 5270);
  assert.equal(result.missing, 4480);
  assert.strictEqual(result.state, before);
  assert.equal(before.subscription.tariffId, 'base');
});

test('purchase deducts balance, updates subscription and records transaction', () => {
  const before = core.createInitialState();
  const result = core.purchase(before, 'base', 3, NOW);

  assert.equal(result.ok, true);
  assert.equal(result.state.balance, 80);
  assert.equal(result.state.subscription.tariffId, 'base');
  assert.equal(result.state.subscription.status, 'active');
  assert.equal(result.state.subscription.daysLeft, 90);
  assert.equal(result.state.transactions[0].amount, -710);
  assert.equal(result.state.transactions[0].type, 'purchase');
  assert.equal(before.balance, 790);
});

test('createTicket validates required fields', () => {
  const state = core.createInitialState();
  const emptySubject = core.createTicket(state, { subject: '', message: 'Описание' }, NOW);
  const emptyMessage = core.createTicket(state, { subject: 'Тема', message: '   ' }, NOW);

  assert.equal(emptySubject.code, 'SUBJECT_REQUIRED');
  assert.equal(emptyMessage.code, 'MESSAGE_REQUIRED');
  assert.strictEqual(emptySubject.state, state);
});

test('createTicket appends a local ticket and keeps attachment metadata only', () => {
  const before = core.createInitialState();
  const result = core.createTicket(before, {
    subject: 'Не подключается Windows',
    message: 'Показывает ошибку подключения',
    attachmentName: 'screen.png',
  }, NOW);

  assert.equal(result.ok, true);
  assert.equal(result.ticket.subject, 'Не подключается Windows');
  assert.equal(result.ticket.attachmentName, 'screen.png');
  assert.equal(result.ticket.messages.length, 1);
  assert.equal(result.state.tickets.length, before.tickets.length + 1);
  assert.equal(before.tickets.length, 1);
});

test('replyTicket rejects unknown ticket and appends a valid reply', () => {
  const before = core.createInitialState();
  const missing = core.replyTicket(before, 'ticket-missing', 'Ответ', NOW);
  const existingId = before.tickets[0].id;
  const valid = core.replyTicket(before, existingId, 'Спасибо, проверю', NOW);

  assert.equal(missing.code, 'TICKET_NOT_FOUND');
  assert.equal(valid.ok, true);
  assert.equal(valid.state.tickets[0].messages.length, 2);
  assert.equal(valid.state.tickets[0].messages[1].author, 'user');
  assert.equal(before.tickets[0].messages.length, 1);
});

test('replyTicket rejects an empty message', () => {
  const state = core.createInitialState();
  const result = core.replyTicket(state, state.tickets[0].id, '  ', NOW);

  assert.equal(result.ok, false);
  assert.equal(result.code, 'MESSAGE_REQUIRED');
});

test('linkEmail validates email and stores a normalized address', () => {
  const state = core.createInitialState();
  const invalid = core.linkEmail(state, 'wrong-address');
  const valid = core.linkEmail(state, ' Demo.User@Example.COM ');

  assert.equal(invalid.code, 'INVALID_EMAIL');
  assert.equal(valid.ok, true);
  assert.equal(valid.state.profile.email, 'demo.user@example.com');
  assert.equal(valid.state.profile.emailVerified, false);
  assert.equal(state.profile.email, '');
});

test('setNotification changes a known setting and rejects unknown keys', () => {
  const state = core.createInitialState();
  const valid = core.setNotification(state, 'news', false);
  const invalid = core.setNotification(state, 'unknown', true);

  assert.equal(valid.ok, true);
  assert.equal(valid.state.notifications.news, false);
  assert.equal(state.notifications.news, true);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.code, 'NOTIFICATION_NOT_FOUND');
});

test('setTheme and setSession only accept supported values', () => {
  const state = core.createInitialState();
  const light = core.setTheme(state, 'light');
  const invalidTheme = core.setTheme(state, 'sepia');
  const active = core.setSession(state, true);

  assert.equal(light.state.theme, 'light');
  assert.equal(invalidTheme.code, 'THEME_NOT_SUPPORTED');
  assert.equal(active.state.sessionActive, true);
  assert.equal(state.sessionActive, false);
});

test('setOnboarding marks completion without mutating state', () => {
  const state = core.createInitialState();
  const result = core.setOnboarding(state, true);

  assert.equal(result.ok, true);
  assert.equal(result.state.onboardingCompleted, true);
  assert.equal(state.onboardingCompleted, false);
});
