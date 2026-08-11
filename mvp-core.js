(function attachSuetaCore(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.SuetaCore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function createSuetaCore() {
  'use strict';

  const SUPPORTED_PERIODS = Object.freeze([1, 3, 6, 12]);
  const PERIOD_DISCOUNTS = Object.freeze({ 1: 0, 3: 5, 6: 10, 12: 20 });
  const NOTIFICATION_KEYS = Object.freeze([
    'subscription',
    'traffic',
    'balance',
    'news',
    'promo',
  ]);

  const TARIFFS = Object.freeze([
    Object.freeze({
      id: 'start',
      name: 'СТАРТ',
      tagline: 'Для одного устройства',
      priceMonthly: 149,
      devices: 1,
      traffic: 50,
      tone: 'quiet',
    }),
    Object.freeze({
      id: 'base',
      name: 'БАЗА',
      tagline: 'Оптимальный выбор',
      priceMonthly: 249,
      devices: 5,
      traffic: 100,
      tone: 'accent',
      popular: true,
    }),
    Object.freeze({
      id: 'elite',
      name: 'ЭЛИТА',
      tagline: 'Больше локаций и трафика',
      priceMonthly: 399,
      devices: 10,
      traffic: 300,
      tone: 'premium',
    }),
    Object.freeze({
      id: 'family',
      name: 'СЕМЬЯ',
      tagline: 'Для всех домашних устройств',
      priceMonthly: 549,
      devices: 20,
      traffic: 600,
      tone: 'family',
    }),
  ]);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createInitialState() {
    return {
      version: 1,
      theme: 'dark',
      sessionActive: false,
      onboardingCompleted: false,
      profile: {
        name: 'Алексей',
        username: '@sueta_demo',
        role: 'Пользователь',
        email: '',
        emailVerified: false,
        registeredAt: '11 августа 2026',
      },
      notifications: {
        subscription: true,
        traffic: true,
        balance: true,
        news: true,
        promo: true,
      },
      balance: 790,
      tariffs: clone(TARIFFS),
      subscription: {
        id: 'subscription-demo',
        tariffId: 'base',
        status: 'active',
        daysLeft: 24,
        expiresAt: '04 сентября 2026',
        trafficUsed: 38.4,
        trafficLimit: 100,
        devicesUsed: 2,
        devicesLimit: 5,
      },
      transactions: [
        {
          id: 'transaction-subscription-demo',
          type: 'purchase',
          amount: -249,
          description: 'Подписка БАЗА · 1 месяц',
          date: '2026-08-01T09:30:00.000Z',
          status: 'completed',
        },
        {
          id: 'transaction-deposit-demo',
          type: 'deposit',
          amount: 1000,
          description: 'Демо-пополнение через СБП',
          date: '2026-07-31T18:10:00.000Z',
          status: 'completed',
        },
      ],
      referral: {
        rewardPercent: 20,
        invited: 8,
        active: 5,
        earned: 1480,
        botLink: 'https://example.com/suetavpn-demo/bot?ref=DEMO2026',
        cabinetLink: 'https://example.com/suetavpn-demo?ref=DEMO2026',
      },
      tickets: [
        {
          id: 'ticket-demo',
          subject: 'Как подключить телевизор?',
          status: 'answered',
          createdAt: '2026-08-09T12:20:00.000Z',
          attachmentName: '',
          messages: [
            {
              id: 'message-demo-support',
              author: 'support',
              text: 'Откройте подключение устройства и выберите платформу TV. В MVP это демонстрационная инструкция.',
              date: '2026-08-09T12:25:00.000Z',
            },
          ],
        },
      ],
      appliedPromos: [],
      selectedTariffId: 'base',
      selectedMonths: 1,
    };
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function hydrateState(raw) {
    const defaults = createInitialState();
    let parsed;

    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_error) {
      return defaults;
    }

    if (!isRecord(parsed) || parsed.version !== 1) {
      return defaults;
    }

    const profile = isRecord(parsed.profile)
      ? { ...defaults.profile, ...parsed.profile }
      : defaults.profile;
    const notifications = isRecord(parsed.notifications)
      ? { ...defaults.notifications, ...parsed.notifications }
      : defaults.notifications;

    return {
      ...defaults,
      ...parsed,
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      sessionActive: parsed.sessionActive === true,
      onboardingCompleted: parsed.onboardingCompleted === true,
      profile,
      notifications,
      balance: Number.isFinite(parsed.balance) && parsed.balance >= 0
        ? parsed.balance
        : defaults.balance,
      tariffs: clone(TARIFFS),
      subscription: isRecord(parsed.subscription)
        ? { ...defaults.subscription, ...parsed.subscription }
        : defaults.subscription,
      transactions: Array.isArray(parsed.transactions)
        ? clone(parsed.transactions)
        : defaults.transactions,
      referral: isRecord(parsed.referral)
        ? { ...defaults.referral, ...parsed.referral }
        : defaults.referral,
      tickets: Array.isArray(parsed.tickets) ? clone(parsed.tickets) : defaults.tickets,
      appliedPromos: Array.isArray(parsed.appliedPromos)
        ? parsed.appliedPromos.filter((code) => typeof code === 'string')
        : [],
      selectedTariffId: TARIFFS.some((tariff) => tariff.id === parsed.selectedTariffId)
        ? parsed.selectedTariffId
        : defaults.selectedTariffId,
      selectedMonths: SUPPORTED_PERIODS.includes(Number(parsed.selectedMonths))
        ? Number(parsed.selectedMonths)
        : defaults.selectedMonths,
    };
  }

  function success(state, message, extra) {
    return { ok: true, state, message, ...(extra || {}) };
  }

  function failure(state, code, message, extra) {
    return { ok: false, state, code, message, ...(extra || {}) };
  }

  function makeId(prefix, now) {
    const timestamp = Date.parse(now);
    return `${prefix}-${Number.isFinite(timestamp) ? timestamp : Date.now()}`;
  }

  function normalizeNow(now) {
    const parsed = new Date(now);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  function prependTransaction(state, transaction) {
    return {
      ...state,
      transactions: [transaction, ...state.transactions],
    };
  }

  function topUp(state, rawAmount, method, now) {
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount)) {
      return failure(state, 'AMOUNT_INVALID', 'Введите корректную сумму.');
    }
    if (amount < 100) {
      return failure(state, 'AMOUNT_TOO_LOW', 'Минимальная сумма — 100 ₽.');
    }
    if (amount > 50000) {
      return failure(state, 'AMOUNT_TOO_HIGH', 'Максимальная сумма — 50 000 ₽.');
    }

    const normalizedAmount = Math.round(amount * 100) / 100;
    const normalizedNow = normalizeNow(now);
    const next = prependTransaction(
      { ...state, balance: state.balance + normalizedAmount },
      {
        id: makeId('transaction-topup', normalizedNow),
        type: 'deposit',
        amount: normalizedAmount,
        description: `Демо-пополнение · ${String(method || 'СБП')}`,
        date: normalizedNow,
        status: 'completed',
      },
    );

    return success(next, `Демо-баланс пополнен на ${normalizedAmount} ₽.`);
  }

  function applyPromo(state, rawCode, now) {
    const code = String(rawCode || '').trim().toUpperCase();
    if (code !== 'SUETA10') {
      return failure(state, 'PROMO_NOT_FOUND', 'Промокод не найден. Попробуйте SUETA10.');
    }
    if (state.appliedPromos.includes(code)) {
      return failure(state, 'PROMO_ALREADY_USED', 'Этот демо-промокод уже применён.');
    }

    const normalizedNow = normalizeNow(now);
    const next = prependTransaction(
      {
        ...state,
        balance: state.balance + 100,
        appliedPromos: [...state.appliedPromos, code],
      },
      {
        id: makeId('transaction-promo', normalizedNow),
        type: 'promo',
        amount: 100,
        description: 'Демо-бонус по промокоду SUETA10',
        date: normalizedNow,
        status: 'completed',
      },
    );

    return success(next, 'Начислено 100 ₽ на демо-баланс.');
  }

  function calculatePrice(state, tariffId, rawMonths) {
    const tariff = state.tariffs.find((item) => item.id === tariffId);
    if (!tariff) {
      return { ok: false, code: 'TARIFF_NOT_FOUND', message: 'Тариф не найден.' };
    }

    const months = Number(rawMonths);
    if (!SUPPORTED_PERIODS.includes(months)) {
      return { ok: false, code: 'PERIOD_NOT_SUPPORTED', message: 'Выберите доступный период.' };
    }

    const discountPercent = PERIOD_DISCOUNTS[months];
    const fullPrice = tariff.priceMonthly * months;
    const total = Math.round(fullPrice * (1 - discountPercent / 100));

    return {
      ok: true,
      tariff,
      months,
      monthlyPrice: tariff.priceMonthly,
      discountPercent,
      fullPrice,
      total,
    };
  }

  function formatDateRu(date) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function purchase(state, tariffId, rawMonths, now) {
    const quote = calculatePrice(state, tariffId, rawMonths);
    if (!quote.ok) {
      return failure(state, quote.code, quote.message);
    }
    if (state.balance < quote.total) {
      return failure(
        state,
        'INSUFFICIENT_BALANCE',
        `Для демо-покупки не хватает ${quote.total - state.balance} ₽.`,
        { required: quote.total, missing: quote.total - state.balance },
      );
    }

    const normalizedNow = normalizeNow(now);
    const startedAt = new Date(normalizedNow);
    const expiresAt = new Date(startedAt);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + quote.months * 30);

    const withTransaction = prependTransaction(
      {
        ...state,
        balance: state.balance - quote.total,
        selectedTariffId: quote.tariff.id,
        selectedMonths: quote.months,
        subscription: {
          id: state.subscription?.id || makeId('subscription', normalizedNow),
          tariffId: quote.tariff.id,
          status: 'active',
          daysLeft: quote.months * 30,
          expiresAt: formatDateRu(expiresAt),
          trafficUsed: 0,
          trafficLimit: quote.tariff.traffic,
          devicesUsed: 0,
          devicesLimit: quote.tariff.devices,
        },
      },
      {
        id: makeId('transaction-purchase', normalizedNow),
        type: 'purchase',
        amount: -quote.total,
        description: `Демо-подписка ${quote.tariff.name} · ${quote.months} мес.`,
        date: normalizedNow,
        status: 'completed',
      },
    );

    return success(withTransaction, `Демо-подписка ${quote.tariff.name} активирована.`, {
      quote,
    });
  }

  function createTicket(state, fields, now) {
    const subject = String(fields?.subject || '').trim();
    const message = String(fields?.message || '').trim();
    if (!subject) {
      return failure(state, 'SUBJECT_REQUIRED', 'Укажите тему обращения.');
    }
    if (!message) {
      return failure(state, 'MESSAGE_REQUIRED', 'Опишите вопрос.');
    }

    const normalizedNow = normalizeNow(now);
    const ticketId = makeId('ticket', normalizedNow);
    const ticket = {
      id: ticketId,
      subject,
      status: 'open',
      createdAt: normalizedNow,
      attachmentName: String(fields?.attachmentName || '').trim(),
      messages: [
        {
          id: makeId('message-user', normalizedNow),
          author: 'user',
          text: message,
          date: normalizedNow,
        },
      ],
    };

    const next = { ...state, tickets: [ticket, ...state.tickets] };
    return success(next, 'Демо-тикет создан локально.', { ticket });
  }

  function replyTicket(state, ticketId, rawMessage, now) {
    const message = String(rawMessage || '').trim();
    if (!message) {
      return failure(state, 'MESSAGE_REQUIRED', 'Введите сообщение.');
    }

    const ticketIndex = state.tickets.findIndex((ticket) => ticket.id === ticketId);
    if (ticketIndex < 0) {
      return failure(state, 'TICKET_NOT_FOUND', 'Тикет не найден.');
    }

    const normalizedNow = normalizeNow(now);
    const tickets = state.tickets.map((ticket, index) => {
      if (index !== ticketIndex) return ticket;
      return {
        ...ticket,
        status: 'open',
        messages: [
          ...ticket.messages,
          {
            id: makeId('message-user', normalizedNow),
            author: 'user',
            text: message,
            date: normalizedNow,
          },
        ],
      };
    });

    return success({ ...state, tickets }, 'Ответ добавлен в демо-тикет.');
  }

  function linkEmail(state, rawEmail) {
    const email = String(rawEmail || '').trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(email);
    if (!valid) {
      return failure(state, 'INVALID_EMAIL', 'Введите корректный email.');
    }

    const next = {
      ...state,
      profile: { ...state.profile, email, emailVerified: false },
    };
    return success(next, 'Email сохранён локально. Подтверждение в MVP не отправляется.');
  }

  function setNotification(state, key, value) {
    if (!NOTIFICATION_KEYS.includes(key)) {
      return failure(state, 'NOTIFICATION_NOT_FOUND', 'Настройка уведомлений не найдена.');
    }

    return success(
      { ...state, notifications: { ...state.notifications, [key]: Boolean(value) } },
      'Настройка сохранена локально.',
    );
  }

  function setTheme(state, theme) {
    if (theme !== 'dark' && theme !== 'light') {
      return failure(state, 'THEME_NOT_SUPPORTED', 'Доступны тёмная и светлая темы.');
    }
    return success({ ...state, theme }, 'Тема изменена.');
  }

  function setSession(state, active) {
    return success({ ...state, sessionActive: Boolean(active) }, 'Состояние демо-сессии изменено.');
  }

  function setOnboarding(state, completed) {
    return success(
      { ...state, onboardingCompleted: Boolean(completed) },
      'Состояние обучения сохранено.',
    );
  }

  function setPurchaseSelection(state, tariffId, rawMonths) {
    const quote = calculatePrice(state, tariffId, rawMonths);
    if (!quote.ok) {
      return failure(state, quote.code, quote.message);
    }
    return success(
      { ...state, selectedTariffId: tariffId, selectedMonths: quote.months },
      'Выбор тарифа сохранён.',
      { quote },
    );
  }

  function resetState() {
    return createInitialState();
  }

  return Object.freeze({
    STORAGE_KEY: 'suetavpn_mvp_v1',
    SUPPORTED_PERIODS,
    createInitialState,
    hydrateState,
    topUp,
    applyPromo,
    calculatePrice,
    purchase,
    createTicket,
    replyTicket,
    linkEmail,
    setNotification,
    setTheme,
    setSession,
    setOnboarding,
    setPurchaseSelection,
    resetState,
  });
});
