import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../app/AppProvider';
import { useToast } from '../app/ToastProvider';
import { moveRadioSelection, periodKey, useIsMobile } from '../app/ui';
import { Button } from '../components/Button';
import { TariffCard } from '../components/TariffCard';
import { TARIFFS, getPrice, getTariff } from '../domain/tariffs';
import type { Period, TariffId } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

const PERIODS = [1, 3, 6, 12] as const satisfies readonly Period[];

export function PurchasePage(): JSX.Element {
  const { pending, purchase, setPurchaseDraft, state } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { formatMoney, t } = useI18n();
  const isMobile = useIsMobile();

  const [tariffId, setTariffId] = useState<TariffId>(state.purchaseDraft.tariffId);
  const [months, setMonths] = useState<Period>(state.purchaseDraft.months);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [feedback, setFeedback] = useState<'insufficient' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);
  const errorRef = useRef<HTMLHeadingElement>(null);

  const isPending = submitting || pending.includes('purchase');
  const tariff = getTariff(tariffId);
  const total = useMemo(() => getPrice(tariffId, months) ?? 0, [months, tariffId]);
  const shortfall = Math.max(total - state.wallet.balance, 0);
  const monthlyPrice = getPrice(tariffId, 1) ?? 0;

  /** Цена за месяц: «≈», когда сумма не делится на срок нацело. */
  const perMonth = (period: Period) => {
    const price = getPrice(tariffId, period) ?? 0;
    const prefix = price % period === 0 ? '' : '≈';
    return `${prefix}${formatMoney(Math.round(price / period))}${t('tariffs.perMonthSuffix')}`;
  };

  const savingFor = (period: Period) => monthlyPrice * period - (getPrice(tariffId, period) ?? 0);
  const saving = savingFor(months);

  useEffect(() => {
    setTariffId(state.purchaseDraft.tariffId);
    setMonths(state.purchaseDraft.months);
  }, [state.purchaseDraft]);

  useEffect(() => {
    if (feedback === 'insufficient') errorRef.current?.focus();
  }, [feedback]);

  const chooseTariff = (next: TariffId) => {
    setTariffId(next);
    setFeedback(null);
    void setPurchaseDraft(next, months);
  };

  const choosePeriod = (next: Period) => {
    setMonths(next);
    setFeedback(null);
    void setPurchaseDraft(tariffId, next);
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
        showToast({ kind: 'success', text: t('purchase.success') });
        return;
      }
      if (result.code === 'INSUFFICIENT_BALANCE') {
        setFeedback('insufficient');
        return;
      }
      showToast({ kind: 'error', text: t('purchase.errors.generic') });
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const tariffCopy = tariffId === 'elite' ? 'elite' : 'base';
  const periodNote = t('purchase.period.note', {
    amount: t('purchase.period.drop', {
      from: formatMoney(monthlyPrice),
      to: `${(getPrice(tariffId, 12) ?? 0) % 12 === 0 ? '' : '≈'}${formatMoney(Math.round((getPrice(tariffId, 12) ?? 0) / 12))}`,
    }),
  });

  const planChoice = (
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
  );

  const periodGroup = (
    <div aria-label={t('purchase.accessibility.periodGroup')} className="period-choice-grid" role="radiogroup">
        {PERIODS.map((period, index) => {
          const periodSaving = savingFor(period);
          return (
            <button
              aria-checked={period === months}
              aria-label={t(`tariffs.period.${periodKey(period)}`)}
              className="period-card"
              data-selected={period === months}
              key={period}
              onKeyDown={(event) => moveRadioSelection(event, PERIODS, index, choosePeriod)}
              onClick={() => choosePeriod(period)}
              role="radio"
              tabIndex={period === months ? 0 : -1}
              type="button"
            >
              <span className="period-card__label">{t(`tariffs.period.${periodKey(period)}`)}</span>
              <strong className="period-card__price">{perMonth(period)}</strong>
              <span className="period-card__total">
                {t('purchase.period.perPeriod', { amount: formatMoney(getPrice(tariffId, period) ?? 0) })}
              </span>
              <span className="period-card__saving">
                {periodSaving > 0 ? t('purchase.period.saving', { amount: formatMoney(periodSaving) }) : ''}
              </span>
            </button>
          );
        })}
    </div>
  );

  const periodChoice = (
    <section aria-labelledby="purchase-period-title" className="purchase-section">
      <h2 id="purchase-period-title">{t('purchase.period.title')}</h2>
      {periodGroup}
      <p className="purchase-section__note">{periodNote}</p>
    </section>
  );

  const summaryRows = (
    <dl>
      <div><dt>{t('purchase.summary.tariff')}</dt><dd>{t(`tariffs.${tariffCopy}.name`)}</dd></div>
      <div><dt>{t('purchase.summary.period')}</dt><dd>{t(`tariffs.period.${periodKey(months)}`)}</dd></div>
      <div><dt>{t('purchase.summary.perMonth')}</dt><dd>{perMonth(months)}</dd></div>
      <div className="purchase-summary__total">
        <dt>{t('purchase.summary.total')}</dt>
        <dd data-testid="purchase-total">{formatMoney(total)}</dd>
      </div>
      <div><dt>{t('purchase.summary.balance')}</dt><dd>{formatMoney(state.wallet.balance - total)}</dd></div>
    </dl>
  );

  const feedbackBlock = (
    <>
      {feedback === 'insufficient' ? (
        <div aria-label={t('purchase.accessibility.error')} className="purchase-error" role="alert">
          <h3 ref={errorRef} tabIndex={-1}>{t('purchase.errors.insufficientBalance')}</h3>
          <span>{t('purchase.errors.shortfall', { amount: formatMoney(shortfall) })}</span>
          <Link className="button button--ghost" to="/balance">{t('purchase.errors.topUp')}</Link>
        </div>
      ) : null}
    </>
  );

  if (!isMobile) {
    return (
      <section className="purchase-page">
        <div className="page-heading"><h1>{t('purchase.title')}</h1></div>
        <div className="purchase-layout">
          <div className="purchase-choices">
            {planChoice}
            {periodChoice}
          </div>
          <aside className="purchase-summary">
            <h2>{t('purchase.summary.title')}</h2>
            {summaryRows}
            <div className="purchase-summary__action">
              {feedbackBlock}
              <Button aria-busy={isPending} disabled={isPending} onClick={() => void submit()} variant="primary">
                {t('purchase.summary.submit')}
              </Button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  const stepTitle = step === 1
    ? t('purchase.steps.plan')
    : step === 2 ? t('purchase.steps.period') : t('purchase.steps.review');

  const actionLabel = step === 1
    ? t('purchase.steps.nextPeriod')
    : step === 2 ? t('purchase.steps.nextReview') : t('purchase.summary.submit');

  const hint = step === 1
    ? t('purchase.steps.hintPlan', { name: t(`tariffs.${tariffCopy}.name`) })
    : step === 2
      ? t('purchase.steps.hintPeriod', { period: t(`tariffs.period.${periodKey(months)}`), amount: formatMoney(total) })
      : t('purchase.steps.hintReview');

  return (
    <section className="purchase-page purchase-wizard">
      <div className="purchase-wizard__head">
        <div className="purchase-wizard__bar">
          <Button
            aria-label={t('purchase.steps.back')}
            iconOnly
            onClick={() => (step === 1
              ? navigate('/subscriptions')
              : setStep((current) => (current === 3 ? 2 : 1)))}
            variant="utility"
          >
            ←
          </Button>
          <span className="purchase-wizard__counter">{t('purchase.steps.counter', { amount: step })}</span>
        </div>
        <div aria-hidden="true" className="purchase-wizard__progress" data-step={step}>
          <span /><span /><span />
        </div>
        <h1>{stepTitle}</h1>
      </div>

      <div className="purchase-wizard__body" data-step={step} key={step}>
        {step === 1 ? (
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
        ) : null}

        {step === 2 ? (
          <div className="purchase-wizard__periods">
            {periodGroup}
            <p className="purchase-section__note">{periodNote}</p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="purchase-wizard__review">
            <div className="purchase-summary">{summaryRows}</div>
            <p className="purchase-wizard__saving">
              {saving > 0
                ? t('purchase.steps.savingLine', { amount: formatMoney(saving) })
                : t('purchase.steps.noSaving')}
            </p>
            {feedbackBlock}
          </div>
        ) : null}
      </div>

      <div className="purchase-wizard__action">
        <Button
          aria-busy={step === 3 && isPending}
          disabled={step === 3 && isPending}
          onClick={() => (step === 3 ? void submit() : setStep((current) => (current === 1 ? 2 : 3)))}
          variant="primary"
        >
          {actionLabel}
        </Button>
        <p className="purchase-wizard__hint">{hint}</p>
      </div>
    </section>
  );
}
