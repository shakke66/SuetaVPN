import { useState, type JSX, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../app/AppProvider';
import { Accordion, type AccordionItem } from '../components/Accordion';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { TARIFFS } from '../domain/tariffs';
import type { Tariff, TariffId } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import '../styles/landing.css';

const TARIFF_COPY = {
  base: {
    name: 'tariffs.base.name',
    description: 'tariffs.base.description',
    traffic: 'tariffs.base.traffic',
    devices: 'tariffs.base.devices',
    locations: 'tariffs.base.locations',
    speed: 'tariffs.base.speed',
  },
  elite: {
    name: 'tariffs.elite.name',
    description: 'tariffs.elite.description',
    traffic: 'tariffs.elite.traffic',
    devices: 'tariffs.elite.devices',
    locations: 'tariffs.elite.locations',
    speed: 'tariffs.elite.speed',
  },
} as const satisfies Readonly<Record<
  TariffId,
  Readonly<Record<'name' | 'description' | 'traffic' | 'devices' | 'locations' | 'speed', MessageKey>>
>>;

const TARIFF_EXTRA_FACTS = {
  base: ['tariffs.base.platforms'],
  elite: ['tariffs.elite.platforms', 'tariffs.elite.regularServers'],
} as const satisfies Readonly<Record<TariffId, readonly MessageKey[]>>;

const TRUST_ITEMS = [
  ['dashboard', 'landing.trust.secure'],
  ['support', 'landing.trust.support'],
  ['subscriptions', 'landing.trust.devices'],
] as const satisfies ReadonlyArray<readonly [IconName, MessageKey]>;

const FEATURE_ITEMS = [
  ['subscriptions', 'landing.features.speed'],
  ['globe', 'landing.features.locations'],
  ['dashboard', 'landing.features.simplicity'],
  ['info', 'landing.features.traffic'],
] as const satisfies ReadonlyArray<readonly [IconName, MessageKey]>;

const REVIEW_KEYS = [
  'landing.reviews.first',
  'landing.reviews.second',
  'landing.reviews.third',
] as const satisfies readonly MessageKey[];

function focusSection(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.scrollIntoView?.({ block: 'start' });
  section.focus({ preventScroll: true });
}

function tariffTraffic(tariff: Tariff, t: ReturnType<typeof useI18n>['t']): string {
  if (tariff.traffic.kind === 'unlimited') return t(TARIFF_COPY[tariff.id].traffic);
  return t(TARIFF_COPY[tariff.id].traffic, { amount: tariff.traffic.bypassGb });
}

export function LandingPage(): JSX.Element {
  const navigate = useNavigate();
  const { state, setPurchaseDraft, setTheme } = useApp();
  const { formatMoney, locale, setLocale, t } = useI18n();
  const [selectingTariff, setSelectingTariff] = useState<TariffId | null>(null);
  const nextTheme = state.preferences.theme === 'dark' ? 'light' : 'dark';
  const themeLabel = state.preferences.theme === 'dark'
    ? t('shell.theme.switchToLight')
    : t('shell.theme.switchToDark');
  const localeLabel = locale === 'ru'
    ? t('shell.language.switchToEnglish')
    : t('shell.language.switchToRussian');

  const faqItems: readonly AccordionItem[] = [
    {
      id: 'connection',
      title: t('landing.faq.connectQuestion'),
      content: <p>{t('landing.faq.connectAnswer')}</p>,
    },
    {
      id: 'payment',
      title: t('landing.faq.paymentQuestion'),
      content: <p>{t('landing.faq.paymentAnswer')}</p>,
    },
  ];

  const selectTariff = async (tariffId: TariffId) => {
    setSelectingTariff(tariffId);
    await setPurchaseDraft(tariffId, state.purchaseDraft.months);
    navigate('/auth');
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header__inner">
          <Brand compact to="/" />
          <nav aria-label={t('landing.header.navigation')} className="landing-header__nav">
            <a href="#tariffs" onClick={(event) => focusSection(event, 'tariffs')}>{t('landing.header.tariffs')}</a>
            <a href="#faq" onClick={(event) => focusSection(event, 'faq')}>{t('landing.header.faq')}</a>
          </nav>
          <div className="landing-header__actions">
            <Button aria-label={themeLabel} iconOnly onClick={() => void setTheme(nextTheme)} variant="utility">
              <Icon name={nextTheme === 'light' ? 'sun' : 'moon'} />
            </Button>
            <Button aria-label={localeLabel} className="locale-control" onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')} variant="utility">
              {locale === 'ru' ? 'EN' : 'RU'}
            </Button>
            <Link className="button button--ghost landing-header__sign-in" to="/auth">{t('landing.header.signIn')}</Link>
            <Link className="button button--primary landing-header__cta" to="/auth">
              {t('landing.header.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section aria-labelledby="landing-hero-title" className="landing-hero">
          <p className="landing-eyebrow">{t('landing.hero.eyebrow')}</p>
          <h1 id="landing-hero-title">{t('landing.hero.title')}</h1>
          <p className="landing-hero__description">{t('landing.hero.description')}</p>
          <div className="landing-hero__actions">
            <a className="button button--primary" href="#tariffs" onClick={(event) => focusSection(event, 'tariffs')}>
              {t('landing.hero.primaryAction')}
            </a>
            <a className="button button--ghost" href="#steps" onClick={(event) => focusSection(event, 'steps')}>
              {t('landing.hero.secondaryAction')}
            </a>
          </div>
        </section>

        <section aria-labelledby="landing-trust-title" className="landing-section landing-trust">
          <div className="landing-section__heading">
            <h2 id="landing-trust-title">{t('landing.trust.title')}</h2>
          </div>
          <ul className="landing-trust__list">
            {TRUST_ITEMS.map(([icon, key]) => (
              <li key={key}><Icon name={icon} /><span>{t(key)}</span></li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="landing-features-title" className="landing-section">
          <div className="landing-section__heading">
            <h2 id="landing-features-title">{t('landing.features.title')}</h2>
          </div>
          <div className="landing-feature-grid">
            {FEATURE_ITEMS.map(([icon, key]) => (
              <article className="landing-feature-card" key={key}>
                <span className="landing-icon"><Icon name={icon} size={24} /></span>
                <h3>{t(key)}</h3>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="landing-tariffs-title"
          className="landing-section"
          id="tariffs"
          role="region"
          tabIndex={-1}
        >
          <div className="landing-section__heading">
            <h2 id="landing-tariffs-title">{t('landing.tariffs.title')}</h2>
            <p>{t('landing.tariffs.subtitle')}</p>
          </div>
          <ul aria-label={t('landing.accessibility.tariffList')} className="landing-tariff-grid">
            {TARIFFS.map((tariff) => {
              const copy = TARIFF_COPY[tariff.id];
              const tariffName = t(copy.name);
              return (
                <li className="landing-tariff-card" key={tariff.id}>
                  <article aria-labelledby={`tariff-${tariff.id}-title`}>
                    <div>
                      <h3 id={`tariff-${tariff.id}-title`}>{tariffName}</h3>
                      <p className="landing-tariff-card__description">{t(copy.description)}</p>
                    </div>
                    <p className="landing-tariff-card__price">
                      <strong>{formatMoney(tariff.prices[1])}</strong>
                      <span>{t('tariffs.period.one')}</span>
                    </p>
                    <ul className="landing-tariff-card__facts">
                      <li>{tariffTraffic(tariff, t)}</li>
                      <li>{t(copy.devices, { amount: tariff.devices })}</li>
                      <li>{t(copy.locations, { amount: tariff.locations })}</li>
                      <li>{t(copy.speed, { amount: tariff.speedGbps })}</li>
                      {TARIFF_EXTRA_FACTS[tariff.id].map((key) => <li key={key}>{t(key)}</li>)}
                    </ul>
                    <Button
                      aria-busy={selectingTariff === tariff.id}
                      disabled={selectingTariff !== null}
                      onClick={() => void selectTariff(tariff.id)}
                      variant="primary"
                    >
                      {t('landing.tariffs.select', { name: tariffName })}
                    </Button>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="landing-steps-title"
          className="landing-section"
          id="steps"
          role="region"
          tabIndex={-1}
        >
          <div className="landing-section__heading">
            <h2 id="landing-steps-title">{t('landing.steps.title')}</h2>
          </div>
          <ol className="landing-steps">
            {(['choose', 'signIn', 'connect'] as const).map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{index + 1}</span>
                <p>{t(`landing.steps.${step}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="landing-value-title" className="landing-section landing-value">
          <div>
            <p className="landing-eyebrow">{t('landing.trust.support')}</p>
            <h2 id="landing-value-title">{t('landing.value.title')}</h2>
            <p>{t('landing.value.description')}</p>
          </div>
          <Link className="button button--primary" to="/support">{t('landing.value.action')}</Link>
        </section>

        <section aria-labelledby="landing-reviews-title" className="landing-section">
          <div className="landing-section__heading">
            <h2 id="landing-reviews-title">{t('landing.reviews.title')}</h2>
          </div>
          <div className="landing-review-grid">
            {REVIEW_KEYS.map((key) => <blockquote key={key}>“{t(key)}”</blockquote>)}
          </div>
        </section>

        <section
          aria-labelledby="landing-faq-title"
          className="landing-section landing-faq"
          id="faq"
          role="region"
          tabIndex={-1}
        >
          <div className="landing-section__heading">
            <h2 id="landing-faq-title">{t('landing.faq.title')}</h2>
          </div>
          <Accordion
            ariaLabel={t('landing.accessibility.faqList')}
            defaultOpenIds={['connection']}
            items={faqItems}
          />
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div>
            <Brand compact to="/" />
            <p>{t('landing.footer.description')}</p>
          </div>
          <nav aria-label={t('landing.header.navigation')}>
            <Link to="/info?tab=agreement">{t('landing.footer.agreement')}</Link>
            <Link to="/info?tab=privacy">{t('landing.footer.privacy')}</Link>
            <Link to="/support">{t('landing.footer.support')}</Link>
          </nav>
          <small>{t('landing.footer.copyright')}</small>
        </div>
      </footer>
    </div>
  );
}
