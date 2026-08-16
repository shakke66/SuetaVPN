import type { JSX } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { Transaction } from '../domain/types';
import { Accordion } from './Accordion';

interface TransactionHistoryProps {
  readonly transactions: readonly Transaction[];
}

const transactionTypeKeys = {
  deposit: 'balance.history.deposit',
  promo: 'balance.history.promo',
  purchase: 'balance.history.purchase',
} as const;

export function TransactionHistory({ transactions }: TransactionHistoryProps): JSX.Element {
  const { formatDate, formatMoney, t } = useI18n();

  return (
    <section aria-labelledby="transaction-history-title" className="wallet-history">
      <h2 className="visually-hidden" id="transaction-history-title">{t('balance.history.title')}</h2>
      <Accordion
        ariaLabel={t('balance.accessibility.historyToggle')}
        items={[{
          id: 'transactions',
          title: t('balance.history.title'),
          content: transactions.length === 0 ? (
            <p className="wallet-history__empty">{t('balance.history.empty')}</p>
          ) : (
            <ul className="wallet-history__list">
              {transactions.map((transaction) => (
                <li className="wallet-history__item" key={transaction.id}>
                  <div>
                    <strong>{t(transactionTypeKeys[transaction.type])}</strong>
                    <span>{transaction.description}</span>
                  </div>
                  <div>
                    <strong className={transaction.amount >= 0 ? 'wallet-amount--positive' : ''}>
                      {formatMoney(transaction.amount)}
                    </strong>
                    <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
                  </div>
                </li>
              ))}
            </ul>
          ),
        }]}
      />
    </section>
  );
}
