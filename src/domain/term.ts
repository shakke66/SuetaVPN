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

/**
 * Остаток обходного трафика. Здесь, в отличие от срока, лимит фиксирован
 * (40 ГБ в месяц у ЭЛИТЫ), поэтому доля осмысленна: четверть запаса — повод
 * присмотреться, десятая часть — повод экономить. У тарифов без лимита
 * состояния нет вовсе: полосе нечего показывать.
 */
export function trafficState(usedGb: number, limitGb: number): TermState | null {
  if (limitGb <= 0) return null;
  const left = limitGb - usedGb;
  if (left <= 0) return 'off';
  const share = left / limitGb;
  if (share <= 0.1) return 'crit';
  if (share <= 0.25) return 'warn';
  return 'ok';
}
