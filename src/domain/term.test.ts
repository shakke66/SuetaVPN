import { describe, expect, it } from 'vitest';
import { termState } from './term';
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
