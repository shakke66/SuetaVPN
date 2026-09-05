import type { Subscription } from './types';

/** Состояние срока подписки: им красится полоса и подписывается остаток. */
export type TermState = 'ok' | 'warn' | 'crit' | 'off';

/**
 * Пороги заданы в днях, а не в долях срока. Десять процентов годовой подписки —
 * это 36 дней, паниковать рано; десять процентов месячной — 3 дня, платить надо
 * сегодня. Время на продление величина абсолютная, поэтому процент как мера
 * срочности не работает.
 */
export const TERM_WARN_DAYS = 14;
export const TERM_CRITICAL_DAYS = 3;

export function termState(subscription: Subscription | null): TermState {
  if (!subscription || subscription.status === 'expired' || subscription.daysLeft <= 0) return 'off';
  if (subscription.daysLeft <= TERM_CRITICAL_DAYS) return 'crit';
  if (subscription.daysLeft <= TERM_WARN_DAYS) return 'warn';
  return 'ok';
}
