import { describe, expect, it } from 'vitest';
import { termState, trafficState } from './term';
import type { Subscription } from './types';

const base: Subscription = {
  id: 'subscription-current',
  tariffId: 'base',
  status: 'active',
  daysLeft: 30,
  periodDays: 30,
  expiresAt: '2026-10-01T00:00:00.000Z',
  trafficUsed: 0,
  trafficLimit: 0,
  devicesUsed: 0,
  devicesLimit: 4,
  autoRenew: true,
};

/** Пороги считаются в днях, а не в процентах: 10% года — это 36 дней, 10% месяца — 3 дня. */
describe('termState', () => {
  it.each([
    { daysLeft: 360, expected: 'ok' },
    { daysLeft: 30, expected: 'ok' },
    { daysLeft: 15, expected: 'ok' },
    { daysLeft: 14, expected: 'warn' },
    { daysLeft: 9, expected: 'warn' },
    { daysLeft: 4, expected: 'warn' },
    { daysLeft: 3, expected: 'crit' },
    { daysLeft: 1, expected: 'crit' },
    { daysLeft: 0, expected: 'off' },
  ])('на $daysLeft днях даёт $expected', ({ daysLeft, expected }) => {
    expect(termState({ ...base, daysLeft })).toBe(expected);
  });

  it('считает подписку выключенной, когда статус истёк, сколько бы дней ни оставалось', () => {
    expect(termState({ ...base, status: 'expired', daysLeft: 20 })).toBe('off');
  });

  it('считает подписку выключенной, когда её нет вовсе', () => {
    expect(termState(null)).toBe('off');
  });
});

/** У обхода лимит фиксированный, поэтому здесь процент остатка осмыслен — в отличие от срока.
    Границы включительные: ровно четверть запаса — уже предупреждение, ровно десятая — уже критично. */
describe('trafficState', () => {
  it.each([
    { used: 0, expected: 'ok' },
    { used: 20, expected: 'ok' },
    { used: 29, expected: 'ok' },
    { used: 30, expected: 'warn' },
    { used: 35, expected: 'warn' },
    { used: 36, expected: 'crit' },
    { used: 39.9, expected: 'crit' },
    { used: 40, expected: 'off' },
    { used: 45, expected: 'off' },
  ])('на израсходованных $used ГБ из 40 даёт $expected', ({ used, expected }) => {
    expect(trafficState(used, 40)).toBe(expected);
  });

  it('молчит, когда лимита нет вовсе — у БАЗЫ полосы быть не должно', () => {
    expect(trafficState(38.4, 0)).toBeNull();
  });
});
