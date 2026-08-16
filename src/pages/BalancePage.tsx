import { useRef, useState, type JSX } from 'react';
import { useApp } from '../app/AppProvider';
import { Button } from '../components/Button';
import { TransactionHistory } from '../components/TransactionHistory';
import type { PaymentMethod } from '../domain/operations';
import { useI18n } from '../i18n/I18nProvider';

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50_000;

type Feedback = { kind: 'error' | 'success'; message: string } | null;

function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_AMOUNT && value <= MAX_AMOUNT;
}

export function BalancePage(): JSX.Element {
  const { applyPromo, pending, state, topUp } = useApp();
  const { formatMoney, t } = useI18n();
  const [amount, setAmount] = useState(String(MIN_AMOUNT));
  const [method, setMethod] = useState<PaymentMethod>('sbp');
  const [promoCode, setPromoCode] = useState('');
  const [topUpFeedback, setTopUpFeedback] = useState<Feedback>(null);
  const [promoFeedback, setPromoFeedback] = useState<Feedback>(null);
  const topUpInFlight = useRef(false);
  const promoInFlight = useRef(false);
  const numericAmount = Number(amount);
  const topUpPending = topUpInFlight.current || pending.includes('topUp');
  const promoPending = promoInFlight.current || pending.includes('applyPromo');

  const submitTopUp = async () => {
    if (topUpInFlight.current) return;
    if (!isValidAmount(numericAmount)) {
      setTopUpFeedback({ kind: 'error', message: t('balance.validation.range') });
      return;
    }

    topUpInFlight.current = true;
    setTopUpFeedback(null);
    try {
      const result = await topUp({ amount: numericAmount, method });
      setTopUpFeedback({
        kind: result.ok ? 'success' : 'error',
        message: result.ok
          ? t('balance.topUp.success', { amount: formatMoney(numericAmount) })
          : t(result.messageKey as never),
      });
    } finally {
      topUpInFlight.current = false;
    }
  };

  const submitPromo = async () => {
    if (promoInFlight.current) return;
    promoInFlight.current = true;
    setPromoFeedback(null);
    try {
      const result = await applyPromo(promoCode);
      setPromoFeedback({
        kind: result.ok ? 'success' : 'error',
        message: result.ok
          ? t('balance.promo.success', { amount: formatMoney(100) })
          : t(result.messageKey as never),
      });
    } finally {
      promoInFlight.current = false;
    }
  };

  return (
    <section className="wallet-page">
      <div className="page-heading">
        <h1>{t('balance.title')}</h1>
      </div>

      <section aria-labelledby="balance-current-title" className="wallet-card wallet-balance-card">
        <h2 id="balance-current-title">{t('balance.current')}</h2>
        <p>{formatMoney(state.wallet.balance)}</p>
      </section>

      <section aria-labelledby="balance-promo-title" className="wallet-card">
        <h2 id="balance-promo-title">{t('balance.promo.title')}</h2>
        <div className="wallet-inline-form">
          <label className="visually-hidden" htmlFor="promo-code">{t('balance.promo.label')}</label>
          <input
            id="promo-code"
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder={t('balance.promo.placeholder')}
            value={promoCode}
          />
          <Button aria-busy={promoPending} disabled={promoPending} onClick={() => void submitPromo()} variant="utility">
            {t('balance.promo.apply')}
          </Button>
        </div>
        {promoFeedback ? <p role={promoFeedback.kind === 'success' ? 'status' : 'alert'}>{promoFeedback.message}</p> : null}
      </section>

      <section aria-labelledby="balance-top-up-title" className="wallet-card">
        <h2 id="balance-top-up-title">{t('balance.topUp.title')}</h2>
        <div className="wallet-amount-controls">
          <label htmlFor="top-up-amount">{t('balance.topUp.amountLabel')}</label>
          <input
            id="top-up-amount"
            inputMode="numeric"
            max={MAX_AMOUNT}
            min={MIN_AMOUNT}
            onChange={(event) => setAmount(event.target.value)}
            step="1"
            type="number"
            value={amount}
          />
          <input
            aria-label={t('balance.accessibility.amountRange')}
            max={MAX_AMOUNT}
            min={MIN_AMOUNT}
            onChange={(event) => setAmount(event.target.value)}
            step="1"
            type="range"
            value={isValidAmount(numericAmount) ? numericAmount : MIN_AMOUNT}
          />
        </div>
        <div aria-label={t('balance.topUp.methodLabel')} className="wallet-methods" role="radiogroup">
          {(['sbp', 'card'] as const).map((item) => (
            <Button
              aria-checked={method === item}
              key={item}
              onClick={() => setMethod(item)}
              role="radio"
              tabIndex={method === item ? 0 : -1}
              variant="utility"
            >
              {t(`balance.topUp.${item}`)}
            </Button>
          ))}
        </div>
        <div className="wallet-top-up-action">
          {topUpFeedback ? <p role={topUpFeedback.kind === 'success' ? 'status' : 'alert'}>{topUpFeedback.message}</p> : null}
          <Button aria-busy={topUpPending} disabled={topUpPending} onClick={() => void submitTopUp()} variant="primary">
            {t('balance.topUp.submit', { amount: formatMoney(isValidAmount(numericAmount) ? numericAmount : MIN_AMOUNT) })}
          </Button>
        </div>
      </section>

      <TransactionHistory transactions={state.wallet.transactions} />
    </section>
  );
}
