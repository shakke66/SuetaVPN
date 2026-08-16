import { getPrice, getTariff } from './tariffs';
import type {
  AppStateV2,
  Period,
  Result,
  TariffId,
  Ticket,
  TicketMessage,
  TicketNotification,
  Transaction,
} from './types';

export type PaymentMethod = 'sbp' | 'card';

export interface TopUpRequest {
  amount: number;
  method: PaymentMethod;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  attachmentName?: string;
}

export type OperationIdSource = (prefix: string, now: string) => string;

const DEFAULT_ID_SOURCE: OperationIdSource = (prefix, now) => {
  const timestamp = Date.parse(now);
  return `${prefix}-${Number.isFinite(timestamp) ? timestamp : Date.now()}`;
};

function normalizeNow(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function failure(state: AppStateV2, code: string, messageKey: string): Result<AppStateV2> {
  return { ok: false, state, code, messageKey };
}

function success(state: AppStateV2, messageKey: string): Result<AppStateV2> {
  return { ok: true, state, code: 'success', messageKey };
}

function prependTransaction(state: AppStateV2, transaction: Transaction): AppStateV2 {
  return {
    ...state,
    wallet: {
      ...state.wallet,
      transactions: [transaction, ...state.wallet.transactions],
    },
  };
}

function getSubscriptionExpiry(subscription: AppStateV2['subscription']): Date | null {
  if (!subscription) return null;
  const date = new Date(subscription.expiresAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function topUp(
  state: AppStateV2,
  request: TopUpRequest,
  now: string,
  idSource: OperationIdSource = DEFAULT_ID_SOURCE,
): Result<AppStateV2> {
  if (!Number.isFinite(request.amount)) {
    return failure(state, 'AMOUNT_INVALID', 'billing.topUp.amountInvalid');
  }
  if (request.amount < 100) {
    return failure(state, 'AMOUNT_TOO_LOW', 'billing.topUp.amountTooLow');
  }
  if (request.amount > 50_000) {
    return failure(state, 'AMOUNT_TOO_HIGH', 'billing.topUp.amountTooHigh');
  }
  if (request.method !== 'sbp' && request.method !== 'card') {
    return failure(state, 'PAYMENT_METHOD_INVALID', 'billing.topUp.paymentMethodInvalid');
  }

  const normalizedNow = normalizeNow(now);
  const amount = Math.round(request.amount * 100) / 100;
  const transaction: Transaction = {
    id: idSource('transaction', normalizedNow),
    type: 'deposit',
    amount,
    paymentMethod: request.method,
    date: normalizedNow,
    status: 'completed',
  };
  const next = prependTransaction(
    { ...state, wallet: { ...state.wallet, balance: state.wallet.balance + amount } },
    transaction,
  );
  return success(next, 'billing.topUp.success');
}

export function applyPromo(
  state: AppStateV2,
  rawCode: string,
  now: string,
  idSource: OperationIdSource = DEFAULT_ID_SOURCE,
): Result<AppStateV2> {
  const code = rawCode.trim().toUpperCase();
  if (code !== 'SUETA10') {
    return failure(state, 'PROMO_NOT_FOUND', 'billing.promo.notFound');
  }
  if (state.appliedPromos.includes(code)) {
    return failure(state, 'PROMO_ALREADY_USED', 'billing.promo.alreadyUsed');
  }

  const normalizedNow = normalizeNow(now);
  const transaction: Transaction = {
    id: idSource('transaction', normalizedNow),
    type: 'promo',
    amount: 100,
    date: normalizedNow,
    status: 'completed',
  };
  const next = prependTransaction(
    {
      ...state,
      wallet: { ...state.wallet, balance: state.wallet.balance + 100 },
      appliedPromos: [...state.appliedPromos, code],
    },
    transaction,
  );
  return success(next, 'billing.promo.success');
}

export function purchaseSubscription(
  state: AppStateV2,
  tariffId: TariffId,
  months: Period,
  now: string,
  idSource: OperationIdSource = DEFAULT_ID_SOURCE,
): Result<AppStateV2> {
  const tariff = getTariff(tariffId);
  if (!tariff) {
    return failure(state, 'TARIFF_NOT_FOUND', 'subscriptions.purchase.tariffNotFound');
  }
  const total = getPrice(tariffId, months);
  if (total === undefined) {
    return failure(state, 'PERIOD_NOT_SUPPORTED', 'subscriptions.purchase.periodNotSupported');
  }
  if (state.wallet.balance < total) {
    return failure(state, 'INSUFFICIENT_BALANCE', 'subscriptions.purchase.insufficientBalance');
  }

  const normalizedNow = normalizeNow(now);
  const days = months * 30;
  const current = state.subscription;
  const sameActivePlan = current?.status === 'active' && current.tariffId === tariffId;
  const currentExpiry = sameActivePlan ? getSubscriptionExpiry(current) : null;
  const startsAt = currentExpiry ?? new Date(normalizedNow);
  const expiresAt = addDays(startsAt, days).toISOString();
  const subscription: AppStateV2['subscription'] = {
    id: current?.id ?? idSource('subscription', normalizedNow),
    tariffId,
    status: 'active',
    daysLeft: sameActivePlan ? current.daysLeft + days : days,
    expiresAt,
    trafficUsed: sameActivePlan ? current.trafficUsed : 0,
    trafficLimit: tariff.traffic.kind === 'bypass' ? tariff.traffic.bypassGb : 0,
    devicesUsed: sameActivePlan ? current.devicesUsed : 0,
    devicesLimit: tariff.devices,
  };
  const transaction: Transaction = {
    id: idSource('transaction', normalizedNow),
    type: 'purchase',
    amount: -total,
    tariffId,
    months,
    date: normalizedNow,
    status: 'completed',
  };
  const next = prependTransaction(
    {
      ...state,
      wallet: { ...state.wallet, balance: state.wallet.balance - total },
      subscription,
      purchaseDraft: { tariffId, months },
    },
    transaction,
  );
  return success(next, 'subscriptions.purchase.success');
}

export function createTicket(
  state: AppStateV2,
  request: CreateTicketRequest,
  now: string,
  idSource: OperationIdSource = DEFAULT_ID_SOURCE,
): Result<AppStateV2> {
  const subject = request.subject.trim();
  if (!subject) {
    return failure(state, 'SUBJECT_REQUIRED', 'tickets.create.subjectRequired');
  }
  const message = request.message.trim();
  if (!message) {
    return failure(state, 'MESSAGE_REQUIRED', 'tickets.create.messageRequired');
  }

  const normalizedNow = normalizeNow(now);
  const ticketId = idSource('ticket', normalizedNow);
  const ticket: Ticket = {
    id: ticketId,
    subject,
    status: 'open',
    createdAt: normalizedNow,
    attachmentName: request.attachmentName?.trim() ?? '',
    messages: [{
      id: idSource('message', normalizedNow),
      author: 'user',
      text: message,
      date: normalizedNow,
    }],
  };
  const notification: TicketNotification = {
    id: idSource('notification', normalizedNow),
    type: 'ticket-created',
    ticketId,
    read: false,
    readAt: null,
    createdAt: normalizedNow,
  };
  return success({
    ...state,
    tickets: [ticket, ...state.tickets],
    notifications: [notification, ...state.notifications],
  }, 'tickets.create.success');
}

export function replyToTicket(
  state: AppStateV2,
  ticketId: string,
  rawMessage: string,
  now: string,
  idSource: OperationIdSource = DEFAULT_ID_SOURCE,
): Result<AppStateV2> {
  const message = rawMessage.trim();
  if (!message) {
    return failure(state, 'MESSAGE_REQUIRED', 'tickets.reply.messageRequired');
  }
  if (!state.tickets.some((ticket) => ticket.id === ticketId)) {
    return failure(state, 'TICKET_NOT_FOUND', 'tickets.reply.notFound');
  }

  const normalizedNow = normalizeNow(now);
  const tickets = state.tickets.map((ticket): Ticket => {
    if (ticket.id !== ticketId) return ticket;
    const reply: TicketMessage = {
      id: idSource('message', normalizedNow),
      author: 'user',
      text: message,
      date: normalizedNow,
    };
    return { ...ticket, status: 'open', messages: [...ticket.messages, reply] };
  });
  return success({ ...state, tickets }, 'tickets.reply.success');
}

export function markNotificationRead(
  state: AppStateV2,
  notificationId: string,
  now: string,
): Result<AppStateV2> {
  if (!state.notifications.some((notification) => notification.id === notificationId)) {
    return failure(state, 'NOTIFICATION_NOT_FOUND', 'notifications.markRead.notFound');
  }
  const readAt = normalizeNow(now);
  const notifications = state.notifications.map((notification) => {
    if (notification.id !== notificationId || notification.read) return notification;
    return { ...notification, read: true, readAt };
  });
  return success({ ...state, notifications }, 'notifications.markRead.success');
}

export function markAllNotificationsRead(state: AppStateV2, now: string): Result<AppStateV2> {
  const readAt = normalizeNow(now);
  return success({
    ...state,
    notifications: state.notifications.map((notification) => (
      notification.read ? notification : { ...notification, read: true, readAt }
    )),
  }, 'notifications.markAllRead.success');
}
