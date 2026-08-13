import type { Locale } from '../domain/types';

export const ru = {
  app: { name: 'SuetaVPN', welcome: 'Добро пожаловать, {name}!' },
  billing: { topUp: { success: 'Баланс пополнен', amountInvalid: 'Некорректная сумма', amountTooLow: 'Минимальная сумма — 100 ₽', amountTooHigh: 'Максимальная сумма — 50 000 ₽', paymentMethodInvalid: 'Выберите способ оплаты' }, promo: { success: 'Промокод применён', notFound: 'Промокод не найден', alreadyUsed: 'Промокод уже использован' } },
  subscriptions: { purchase: { success: 'Подписка оформлена', tariffNotFound: 'Тариф не найден', periodNotSupported: 'Период не поддерживается', insufficientBalance: 'Недостаточно средств' } },
  tickets: { create: { success: 'Обращение создано', subjectRequired: 'Укажите тему', messageRequired: 'Введите сообщение' }, reply: { success: 'Ответ отправлен', messageRequired: 'Введите сообщение', notFound: 'Обращение не найдено' } },
  notifications: { markRead: { success: 'Уведомление прочитано', notFound: 'Уведомление не найдено' }, markAllRead: { success: 'Все уведомления прочитаны' } },
  preferences: { theme: 'Тема', locale: 'Язык' },
  common: { loading: 'Загрузка', save: 'Сохранить', cancel: 'Отмена' },
} as const;

export const en = {
  app: { name: 'SuetaVPN', welcome: 'Welcome, {name}!' },
  billing: { topUp: { success: 'Balance topped up', amountInvalid: 'Invalid amount', amountTooLow: 'Minimum amount is ₽100', amountTooHigh: 'Maximum amount is ₽50,000', paymentMethodInvalid: 'Choose a payment method' }, promo: { success: 'Promo code applied', notFound: 'Promo code not found', alreadyUsed: 'Promo code already used' } },
  subscriptions: { purchase: { success: 'Subscription purchased', tariffNotFound: 'Tariff not found', periodNotSupported: 'Period is not supported', insufficientBalance: 'Insufficient balance' } },
  tickets: { create: { success: 'Ticket created', subjectRequired: 'Enter a subject', messageRequired: 'Enter a message' }, reply: { success: 'Reply sent', messageRequired: 'Enter a message', notFound: 'Ticket not found' } },
  notifications: { markRead: { success: 'Notification marked as read', notFound: 'Notification not found' }, markAllRead: { success: 'All notifications marked as read' } },
  preferences: { theme: 'Theme', locale: 'Language' },
  common: { loading: 'Loading', save: 'Save', cancel: 'Cancel' },
} as const;

export const messages = { ru, en } as const;
export type MessageKey = 'app.name' | 'app.welcome' | 'billing.topUp.success' | 'billing.topUp.amountInvalid' | 'billing.topUp.amountTooLow' | 'billing.topUp.amountTooHigh' | 'billing.topUp.paymentMethodInvalid' | 'billing.promo.success' | 'billing.promo.notFound' | 'billing.promo.alreadyUsed' | 'subscriptions.purchase.success' | 'subscriptions.purchase.tariffNotFound' | 'subscriptions.purchase.periodNotSupported' | 'subscriptions.purchase.insufficientBalance' | 'tickets.create.success' | 'tickets.create.subjectRequired' | 'tickets.create.messageRequired' | 'tickets.reply.success' | 'tickets.reply.messageRequired' | 'tickets.reply.notFound' | 'notifications.markRead.success' | 'notifications.markRead.notFound' | 'notifications.markAllRead.success' | 'preferences.theme' | 'preferences.locale' | 'common.loading' | 'common.save' | 'common.cancel';

export function getMessage(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  const value = key.split('.').reduce<unknown>((obj, part) => (obj as Record<string, unknown>)[part], messages[locale]);
  return String(value ?? key).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
