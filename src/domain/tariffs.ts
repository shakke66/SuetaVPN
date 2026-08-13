import type { Period, Tariff, TariffId } from './types';

export const TARIFFS = [
  { id: 'base', devices: 4, locations: 4, speedGbps: 1,
    prices: { 1: 250, 3: 490, 6: 940, 12: 1390 }, traffic: { kind: 'unlimited' } },
  { id: 'elite', devices: 6, locations: 6, speedGbps: 10,
    prices: { 1: 310, 3: 690, 6: 1290, 12: 1990 }, traffic: { kind: 'bypass', bypassGb: 40 } },
] as const satisfies readonly Tariff[];

export function getTariff(id: string): Tariff | undefined {
  return TARIFFS.find((tariff) => tariff.id === id);
}

export function getPrice(tariffId: TariffId, months: Period): number | undefined {
  return getTariff(tariffId)?.prices[months];
}
