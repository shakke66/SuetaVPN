import { TransactionHistory } from 'suetavpn';

const TRANSACTIONS = [
  {
    id: 'transaction-purchase-elite',
    type: 'purchase',
    amount: -1990,
    tariffId: 'elite',
    months: 12,
    date: '2026-08-18T10:12:00.000Z',
    status: 'completed',
  },
  {
    id: 'transaction-deposit-sbp',
    type: 'deposit',
    amount: 2000,
    paymentMethod: 'sbp',
    date: '2026-08-18T10:05:00.000Z',
    status: 'completed',
  },
  {
    id: 'transaction-promo',
    type: 'promo',
    amount: 100,
    date: '2026-08-11T19:41:00.000Z',
    status: 'completed',
  },
  {
    id: 'transaction-purchase-base',
    type: 'purchase',
    amount: -490,
    tariffId: 'base',
    months: 3,
    date: '2026-08-01T09:30:00.000Z',
    status: 'completed',
  },
  {
    id: 'transaction-deposit-card',
    type: 'deposit',
    amount: 1000,
    paymentMethod: 'card',
    date: '2026-07-31T18:10:00.000Z',
    status: 'completed',
  },
] as const;

/** Раскрытый список: пополнения зелёные, списания обычные, у каждой строки дата. */
export const Expanded = () => (
  <TransactionHistory defaultOpen transactions={TRANSACTIONS} />
);

/** Состояние по умолчанию на экране баланса — история свёрнута. */
export const Collapsed = () => (
  <TransactionHistory transactions={TRANSACTIONS} />
);

/** Операций ещё не было: отдельное компактное состояние. */
export const Empty = () => (
  <TransactionHistory defaultOpen transactions={[]} />
);
