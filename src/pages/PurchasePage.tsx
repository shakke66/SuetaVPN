import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { Button } from '../components/Button';
import { TariffCard } from '../components/TariffCard';
import { TARIFFS, getPrice, getTariff } from '../domain/tariffs';
import type { Period, TariffId } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

const PERIODS = [1, 3, 6, 12] as const satisfies readonly Period[];

function periodKey(period: Period): 'one' | 'three' | 'six' | 'twelve' {
  if (period === 1) return 'one';
  if (period === 3) return 'three';
  if (period === 6) return 'six';
  return 'twelve';
}

function moveRadioSelection<T>(
  event: KeyboardEvent<HTMLButtonElement>,
  values: readonly T[],
  currentIndex: number,
  select: (value: T) => void,
): void {
  let nextIndex: number | null = null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % values.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + values.length) % values.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = values.length - 1;
  }
  if (nextIndex === null) return;

  event.preventDefault();
  select(values[nextIndex]);
  event.currentTarget
    .closest('[role="radiogroup"]')
    ?.querySelectorAll<HTMLElement>('[role="radio"]')
    .item(nextIndex)
    .focus();
}

export function PurchasePage(): JSX.Element {
  const { pending, purchase, setPurchaseDraft, state } = useApp();
  const { formatMoney, t } = useI18n();
  const [tariffId, setTariffId] = useState<TariffId>(state.purchaseDraft.tariffId);
  const [months, setMonths] = useState<Period>(state.purchaseDraft.months);
  const [feedback, setFeedback] = useState<'generic' | 'insufficient' | 'success' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);
  const errorRef = useRef<HTMLHeadingElement>(null);
  const isPending = submitting || pending.includes('purchase');
  const tariff = getTariff(tariffId);
  const total = useMemo(() => getPrice(tariffId, months) ?? 0, [months, tariffId]);
  const shortfall = Math.max(total - state.wallet.balance, 0);

  useEffect(() => {
    setTariffId(state.purchaseDraft.tariffId);
    setMonths(state.purchaseDraft.months);
  }, [state.purchaseDraft]);

  useEffect(() => {
    if (feedback === 'insufficient') errorRef.current?.focus();
  }, [feedback]);

  const chooseTariff = (nextTariff: TariffId) => {
    setTariffId(nextTariff);
    setFeedback(null);
    void setPurchaseDraft(nextTariff, months);
  };

  const choosePeriod = (nextPeriod: Period) => {
    setMonths(nextPeriod);
    setFeedback(null);
    void setPurchaseDraft(tariffId, nextPeriod);
  };

  const submit = async () => {
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setSubmitting(true);
    setFeedback(null);
    try {
      await setPurchaseDraft(tariffId, months);
      const result = await purchase(tariffId, months);
      if (result.ok) {
        setFeedback('success');
        return;
      }
      setFeedback(result.code === 'INSUFFICIENT_BALANCE' ? 'insufficient' : 'generic');
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const tariffCopy = tariffId === 'base' ? 'base' : 'elite';
  return (
    <section className="purchase-page">
      <div className="page-heading">
        <h1>{t('purchase.title')}</h1>
      </div>
      <div className="purchase-layout">
        <div className="purchase-choices">
          <section aria-labelledby="purchase-plan-title" className="purchase-section">
            <h2 id="purchase-plan-title">{t('purchase.plan.title')}</h2>
            <div aria-label={t('purchase.accessibility.planGroup')} className="tariff-choice-grid" role="radiogroup">
              {TARIFFS.map((item, index) => (
                <TariffCard
                  key={item.id}
                  onKeyDown={(event) => moveRadioSelection(event, TARIFFS, index, (selected) => chooseTariff(selected.id))}
                  onSelect={(selected) => chooseTariff(selected.id)}
                  selected={item.id === tariffId}
                  tabIndex={item.id === tariffId ? 0 : -1}
                  tariff={item}
                />
              ))}
            </div>
          </section>
          <section aria-labelledby="purchase-period-title" className="purchase-section">
            <h2 id="purchase-period-title">{t('purchase.period.title')}</h2>
            <div aria-label={t('purchase.accessibility.periodGroup')} className="period-choice-grid" role="radiogroup">
              {PERIODS.map((period, index) => (
                <Button
                  aria-checked={period === months}
                  className="period-choice"
                  key={period}
                  onKeyDown={(event) => moveRadioSelection(event, PERIODS, index, choosePeriod)}
                  onClick={() => choosePeriod(period)}
                  role="radio"
                  tabIndex={period === months ? 0 : -1}
                  variant="utility"
                >
                  {t(`tariffs.period.${periodKey(period)}`)}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <aside className="purchase-summary">
          <h2>{t('purchase.summary.title')}</h2>
          <dl>
            <div><dt>{t('purchase.summary.tariff')}</dt><dd>{t(`tariffs.${tariffCopy}.name`)}</dd></div>
            <div><dt>{t('purchase.summary.period')}</dt><dd>{t(`tariffs.period.${periodKey(months)}`)}</dd></div>
            <div><dt>{t('purchase.summary.total')}</dt><dd data-testid="purchase-total">{formatMoney(total)}</dd></div>
            <div><dt>{t('purchase.summary.balance')}</dt><dd>{formatMoney(state.wallet.balance - total)}</dd></div>
          </dl>
          <div className="purchase-summary__action">
            {feedback === 'success' ? <p role="status">{t('purchase.success')}</p> : null}
            {feedback === 'generic' ? <div aria-label={t('purchase.accessibility.error')} role="alert" tabIndex={-1}>{t('purchase.errors.generic')}</div> : null}
            {feedback === 'insufficient' ? (
              <div aria-label={t('purchase.accessibility.error')} className="purchase-error" role="alert">
                <h3 ref={errorRef} tabIndex={-1}>{t('purchase.errors.insufficientBalance')}</h3>
                <span>{t('purchase.errors.shortfall', { amount: formatMoney(shortfall) })}</span>
                <Link className="button button--ghost" to="/balance">{t('purchase.errors.topUp')}</Link>
              </div>
            ) : null}
            <Button aria-busy={isPending} disabled={isPending} onClick={() => void submit()} variant="primary">
              {t('purchase.summary.submit')}
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
