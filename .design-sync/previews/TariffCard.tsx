import { TariffCard } from 'suetavpn';

const BASE = {
  id: 'base',
  devices: 4,
  locations: 4,
  speedGbps: 1,
  prices: { 1: 250, 3: 490, 6: 940, 12: 1390 },
  traffic: { kind: 'unlimited' },
} as const;

const ELITE = {
  id: 'elite',
  devices: 6,
  locations: 6,
  speedGbps: 10,
  prices: { 1: 310, 3: 690, 6: 1290, 12: 1990 },
  traffic: { kind: 'bypass', bypassGb: 40 },
} as const;

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 16,
  alignItems: 'stretch',
};

const noop = () => {};

/** Выбор тарифа на экране покупки: выбран базовый. */
export const BaseSelected = () => (
  <div role="radiogroup" aria-label="Выберите тариф" style={grid}>
    <TariffCard onKeyDown={noop} onSelect={noop} selected tabIndex={0} tariff={BASE} />
    <TariffCard onKeyDown={noop} onSelect={noop} selected={false} tabIndex={-1} tariff={ELITE} />
  </div>
);

/** Тот же выбор, но со старшим тарифом: добавляется квота обхода. */
export const EliteSelected = () => (
  <div role="radiogroup" aria-label="Выберите тариф" style={grid}>
    <TariffCard onKeyDown={noop} onSelect={noop} selected={false} tabIndex={-1} tariff={BASE} />
    <TariffCard onKeyDown={noop} onSelect={noop} selected tabIndex={0} tariff={ELITE} />
  </div>
);
