import type { JSX } from 'react';
import { useI18n, type I18nValue } from '../i18n/I18nProvider';
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

function description(transaction: Transaction, t: I18nValue['t']): string {
  if (transaction.type === 'deposit') {
    if (transaction.paymentMethod === 'sbp') return t('balance.history.depositSbp');
    if (transaction.paymentMethod === 'card') return t('balance.history.depositCard');
    return t('balance.history.depositGeneric');
  }
  if (transaction.type === 'promo') return t('balance.history.promoDescription');
  if (transaction.tariffId && transaction.months) {
    return t('balance.history.purchasePlan', {
      name: t(`tariffs.${transaction.tariffId}.name`),
      period: t('common.months', { amount: transaction.months }),
    });
  }
  return t('balance.history.purchaseGeneric');
}

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
                    <span>{description(transaction, t)}</span>
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
