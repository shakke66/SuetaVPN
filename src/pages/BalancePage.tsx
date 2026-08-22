import { useRef, useState, type JSX } from 'react';
import { useApp } from '../app/AppProvider';
import { useToast } from '../app/ToastProvider';
import { moveRadioSelection, useIsMobile } from '../app/ui';
import { Button } from '../components/Button';
import { TransactionHistory } from '../components/TransactionHistory';
import type { PaymentMethod } from '../domain/operations';
import { useI18n } from '../i18n/I18nProvider';

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50_000;
const STEP = 500;
const PRESETS = [500, 1000, 2000, 5000] as const;
const PAYMENT_METHODS = ['sbp', 'card'] as const satisfies readonly PaymentMethod[];

function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_AMOUNT && value <= MAX_AMOUNT;
}

/** Русский счёт: 1 операция, 2 операции, 5 операций. */
function pluralKey(count: number): 'balance.operationsFew' | 'balance.operationsMany' | 'balance.operationsOne' {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return 'balance.operationsMany';
  const last = count % 10;
  if (last === 1) return 'balance.operationsOne';
  if (last >= 2 && last <= 4) return 'balance.operationsFew';
  return 'balance.operationsMany';
}

function clamp(value: number): number {
  return Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, value));
}

export function BalancePage(): JSX.Element {
  const { applyPromo, pending, state, topUp } = useApp();
  const { showToast } = useToast();
  const { formatMoney, t } = useI18n();
  const isMobile = useIsMobile();

  const [amount, setAmount] = useState(String(1000));
  const [method, setMethod] = useState<PaymentMethod>('sbp');
  const [promoCode, setPromoCode] = useState('');
  const [tab, setTab] = useState<'topUp' | 'history'>('topUp');
  const topUpInFlight = useRef(false);
  const promoInFlight = useRef(false);

  const numericAmount = Number(amount);
  const valid = isValidAmount(numericAmount);
  const topUpPending = topUpInFlight.current || pending.includes('topUp');
  const promoPending = promoInFlight.current || pending.includes('applyPromo');
  const transactions = state.wallet.transactions;

  const submitTopUp = async () => {
    if (topUpInFlight.current) return;
    if (!valid) {
      showToast({ kind: 'error', text: t('balance.validation.range') });
      return;
    }

    topUpInFlight.current = true;
    try {
      const result = await topUp({ amount: numericAmount, method });
      showToast({
        kind: result.ok ? 'success' : 'error',
        text: result.ok
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
    try {
      const result = await applyPromo(promoCode);
      showToast({
        kind: result.ok ? 'success' : 'error',
        text: result.ok
          ? t('balance.promo.success', { amount: formatMoney(100) })
          : t(result.messageKey as never),
      });
    } finally {
      promoInFlight.current = false;
    }
  };

  const methodName = method === 'sbp' ? t('balance.topUp.sbp') : t('balance.cardLower');
  const summaryLine = t('balance.summaryLine', {
    amount: formatMoney(state.wallet.balance + (valid ? numericAmount : 0)),
    method: methodName,
  });
  const operationsLabel = t(pluralKey(transactions.length), { amount: transactions.length });
  const operationsTotal = t('balance.operationsTotal', { amount: operationsLabel });
  const submitLabel = t('balance.topUp.submit', {
    amount: formatMoney(valid ? numericAmount : MIN_AMOUNT),
  });

  const amountField = (
    <div className="wallet-amount">
      <label className="visually-hidden" htmlFor="top-up-amount">{t('balance.topUp.amountLabel')}</label>
      <input
        id="top-up-amount"
        inputMode="numeric"
        max={MAX_AMOUNT}
        min={MIN_AMOUNT}
        onChange={(event) => setAmount(event.target.value)}
        step={100}
        type="number"
        value={amount}
      />
      <span aria-hidden="true" className="wallet-amount__currency">₽</span>
      <span className="wallet-amount__steppers">
        <Button
          aria-label={t('balance.stepDown', { amount: formatMoney(STEP) })}
          iconOnly
          onClick={() => setAmount(String(clamp((valid ? numericAmount : MIN_AMOUNT) - STEP)))}
          variant="utility"
        >
          −
        </Button>
        <Button
          aria-label={t('balance.stepUp', { amount: formatMoney(STEP) })}
          iconOnly
          onClick={() => setAmount(String(clamp((valid ? numericAmount : MIN_AMOUNT) + STEP)))}
          variant="utility"
        >
          +
        </Button>
      </span>
    </div>
  );

  const presets = (
    <div className="wallet-presets">
      {PRESETS.map((preset) => (
        <button
          aria-pressed={valid && numericAmount === preset}
          className="wallet-preset"
          data-selected={valid && numericAmount === preset}
          key={preset}
          onClick={() => setAmount(String(preset))}
          type="button"
        >
          {formatMoney(preset)}
        </button>
      ))}
    </div>
  );

  const methodChoice = (
    <div aria-label={t('balance.topUp.methodLabel')} className="wallet-methods" role="radiogroup">
      {PAYMENT_METHODS.map((item, index) => (
        <button
          aria-checked={method === item}
          aria-label={t(`balance.topUp.${item}`)}
          className="wallet-method"
          data-selected={method === item}
          key={item}
          onClick={() => setMethod(item)}
          onKeyDown={(event) => moveRadioSelection(event, PAYMENT_METHODS, index, setMethod)}
          role="radio"
          tabIndex={method === item ? 0 : -1}
          type="button"
        >
          <span aria-hidden="true" className="wallet-method__dot" />
          <strong>{t(`balance.topUp.${item}`)}</strong>
          <span className="wallet-method__hint">{t(item === 'sbp' ? 'balance.sbpHint' : 'balance.cardHint')}</span>
        </button>
      ))}
    </div>
  );

  const promoBlock = (
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
  );

  if (isMobile) {
    const historyMode = tab === 'history';

    return (
      <section className="wallet-page wallet-mobile">
        <div className="wallet-mobile__head">
          <div>
            <span>{t('balance.current')}</span>
            <strong>{formatMoney(state.wallet.balance)}</strong>
          </div>
          <span className="wallet-mobile__count">{operationsLabel}</span>
        </div>

        <div aria-label={t('balance.tabs.label')} className="wallet-tabs" role="tablist">
          {(['topUp', 'history'] as const).map((item) => (
            <button
              aria-selected={tab === item}
              key={item}
              onClick={() => setTab(item)}
              role="tab"
              type="button"
            >
              {t(`balance.tabs.${item}`)}
            </button>
          ))}
        </div>

        <div className="wallet-mobile__body">
          {historyMode ? (
            <TransactionHistory bare transactions={transactions} />
          ) : (
            <>
              <div className="wallet-field">
                <span className="wallet-field__label">{t('balance.rangeShort')}</span>
                {presets}
                {amountField}
              </div>

              <div className="wallet-field">
                <span className="wallet-field__label">{t('balance.steps.method')}</span>
                {methodChoice}
              </div>

              {promoBlock}
            </>
          )}
        </div>

        <div className="wallet-mobile__action">
          <Button
            aria-busy={topUpPending}
            disabled={topUpPending}
            onClick={() => (historyMode ? setTab('topUp') : void submitTopUp())}
            variant="primary"
          >
            {historyMode ? t('balance.topUp.title') : submitLabel}
          </Button>
          <p className="wallet-mobile__hint">{historyMode ? operationsTotal : summaryLine}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="wallet-page">
      <div className="page-heading"><h1>{t('balance.title')}</h1></div>

      <div className="wallet-layout">
        <section aria-labelledby="balance-top-up-title" className="wallet-card wallet-top-up">
          <div className="wallet-top-up__heading">
            <h2 id="balance-top-up-title">{t('balance.topUp.title')}</h2>
            <p>{t('balance.range')}</p>
          </div>

          <div className="wallet-step">
            <span className="wallet-step__label"><b>01</b>{t('balance.steps.amount')}</span>
            {presets}
            {amountField}
          </div>

          <div className="wallet-step">
            <span className="wallet-step__label"><b>02</b>{t('balance.steps.method')}</span>
            {methodChoice}
          </div>

          <div className="wallet-step wallet-step--confirm">
            <span className="wallet-step__label"><b>03</b>{t('balance.steps.confirm')}</span>
            <div className="wallet-confirm">
              <span className="wallet-confirm__summary">{summaryLine}</span>
              <Button aria-busy={topUpPending} disabled={topUpPending} onClick={() => void submitTopUp()} variant="primary">
                {submitLabel}
              </Button>
            </div>
          </div>
        </section>

        <div className="wallet-aside">
          <section aria-labelledby="balance-current-title" className="wallet-card wallet-current">
            <h2 id="balance-current-title">{t('balance.current')}</h2>
            <p>{formatMoney(state.wallet.balance)}</p>
          </section>

          <section aria-labelledby="balance-promo-title" className="wallet-card wallet-promo">
            <h2 id="balance-promo-title">{t('balance.promo.title')}</h2>
            {promoBlock}
          </section>

          <TransactionHistory defaultOpen transactions={transactions} />
        </div>
      </div>
    </section>
  );
}
