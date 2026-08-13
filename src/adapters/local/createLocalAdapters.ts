import type { LocalAdapters } from '../contracts';
import {
  applyPromo,
  createTicket,
  markAllNotificationsRead,
  markNotificationRead,
  purchaseSubscription,
  replyToTicket,
  topUp,
  type OperationIdSource,
} from '../../domain/operations';

const DEFAULT_DELAY_MS = 250;

export interface LocalAdapterOptions {
  delayMs?: number;
  now?: () => string;
  idSource?: OperationIdSource;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createLocalAdapters(options: LocalAdapterOptions = {}): LocalAdapters {
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const now = options.now ?? (() => new Date().toISOString());
  const run = async <T>(operation: () => T): Promise<T> => {
    await delay(delayMs);
    return operation();
  };

  return {
    billing: {
      topUp: (state, request) => run(() => topUp(state, request, now(), options.idSource)),
      applyPromo: (state, code) => run(() => applyPromo(state, code, now(), options.idSource)),
    },
    subscriptions: {
      purchase: (state, tariffId, months) => run(() => (
        purchaseSubscription(state, tariffId, months, now(), options.idSource)
      )),
    },
    tickets: {
      create: (state, request) => run(() => createTicket(state, request, now(), options.idSource)),
      reply: (state, ticketId, message) => run(() => (
        replyToTicket(state, ticketId, message, now(), options.idSource)
      )),
    },
    notifications: {
      markRead: (state, notificationId) => run(() => markNotificationRead(state, notificationId)),
      markAllRead: (state) => run(() => markAllNotificationsRead(state)),
    },
  };
}
