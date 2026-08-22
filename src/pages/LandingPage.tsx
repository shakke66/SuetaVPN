import { useState, type JSX, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../app/AppProvider';
import { Accordion, type AccordionItem } from '../components/Accordion';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { LanguageMenu } from '../components/LanguageMenu';
import { HeroScene } from '../components/HeroScene';
import { LocationsSection } from '../components/LocationsSection';
import { ScrollReveal } from '../components/ScrollReveal';
import logo from '../assets/suetavpn-logo.png';
import { TARIFFS } from '../domain/tariffs';
import type { Tariff, TariffId } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import '../styles/landing.css';
import '../styles/landing-motion.css';
import '../styles/hero-scene.css';
import '../styles/locations.css';

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
] as const satisfies ReadonlyArray<readonly [IconName, MessageKey]>;

function focusSection(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (!section) return;
  // Anchor navigation must never land on a still-hidden reveal block.
  section.dataset.revealState = 'visible';
  section.classList.add('is-visible');
  const heading = section.querySelector<HTMLElement>('.landing-section__heading');
  (heading ?? section).scrollIntoView?.({ block: 'start' });
  section.focus({ preventScroll: true });
}

function tariffTraffic(tariff: Tariff, t: ReturnType<typeof useI18n>['t']): string {
  if (tariff.traffic.kind === 'unlimited') return t(TARIFF_COPY[tariff.id].traffic);
  return t(TARIFF_COPY[tariff.id].traffic, { amount: tariff.traffic.bypassGb });
}

export function LandingPage(): JSX.Element {
  const navigate = useNavigate();
  const { state, setPurchaseDraft, setTheme } = useApp();
  const { formatDate, formatMoney, t } = useI18n();
  const [selectingTariff, setSelectingTariff] = useState<TariffId | null>(null);
  const heroTitleWords = t('landing.hero.title').split(/\s+/);
  const heroTitleSplit = Math.max(1, Math.ceil(heroTitleWords.length / 2));
  const heroTitleLead = heroTitleWords.slice(0, heroTitleSplit).join(' ');
  const heroTitleAccent = heroTitleWords.slice(heroTitleSplit).join(' ');
  const nextTheme = state.preferences.theme === 'dark' ? 'light' : 'dark';
  const themeLabel = state.preferences.theme === 'dark'
    ? t('shell.theme.switchToLight')
    : t('shell.theme.switchToDark');
  const subscription = state.subscription;
  const currentTariff = TARIFFS.find((item) => item.id === subscription?.tariffId) ?? TARIFFS[0];
  const currentTariffCopy = TARIFF_COPY[currentTariff.id];
  const trafficUsed = subscription?.trafficUsed ?? 0;
  const trafficLimit = subscription?.trafficLimit ?? 0;
  const trafficPercent = trafficLimit > 0
    ? Math.min(100, Math.round((trafficUsed / trafficLimit) * 100))
    : Math.min(100, Math.round(trafficUsed));
  const trafficLabel = currentTariff.traffic.kind === 'unlimited'
    ? t(currentTariffCopy.traffic)
    : t(currentTariffCopy.traffic, { amount: currentTariff.traffic.bypassGb });
  const subscriptionStatus = subscription
    ? (subscription.status === 'active' ? t('common.status.active') : t('common.status.expired'))
    : t('common.empty');
  const devicesLabel = t('subscriptions.devices', { amount: '' }).replace(/[:：]\s*$/, '');
  const trafficTitle = t('subscriptions.traffic', { amount: '' }).replace(/[:：]\s*$/, '');

  const faqItems: readonly AccordionItem[] = [
    {
      id: 'service',
      title: t('landing.faq.serviceQuestion'),
      content: <p>{t('landing.faq.serviceAnswer')}</p>,
    },
    {
      id: 'getting-started',
      title: t('landing.faq.startQuestion'),
      content: <p>{t('landing.faq.startAnswer')}</p>,
    },
    {
      id: 'devices',
      title: t('landing.faq.devicesQuestion'),
      content: <p>{t('landing.faq.devicesAnswer')}</p>,
    },
    {
      id: 'protocol',
      title: t('landing.faq.protocolQuestion'),
      content: <p>{t('landing.faq.protocolAnswer')}</p>,
    },
    {
      id: 'refund',
      title: t('landing.faq.refundQuestion'),
      content: <p>{t('landing.faq.refundAnswer')}</p>,
    },
    {
      id: 'logs',
      title: t('landing.faq.logsQuestion'),
      content: <p>{t('landing.faq.logsAnswer')}</p>,
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
            <LanguageMenu />
            <Link className="button button--ghost landing-header__sign-in" to="/auth">{t('landing.header.signIn')}</Link>
            <Link className="button button--primary landing-header__cta" to="/auth">
              {t('landing.header.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section aria-labelledby="landing-hero-title" className="landing-hero">
          <div className="landing-hero__grid">
            <div className="landing-hero__content">
              <div className="landing-hero__intro">
                <p className="landing-eyebrow">{t('landing.hero.eyebrow')}</p>
                <h1 id="landing-hero-title">
                  <span className="landing-hero__title-lead">{heroTitleLead}</span>{' '}
                  <span className="landing-hero__title-accent">{heroTitleAccent}</span>
                </h1>
                <p className="landing-hero__description">{t('landing.hero.description')}</p>
              </div>
              <div className="landing-hero__actions">
                <a className="button button--primary" href="#tariffs" onClick={(event) => focusSection(event, 'tariffs')}>
                  {t('landing.hero.primaryAction')}
                </a>
                <a className="button button--ghost" href="#steps" onClick={(event) => focusSection(event, 'steps')}>
                  {t('landing.hero.secondaryAction')}
                </a>
              </div>
              <div aria-label={t('landing.trust.title')} className="landing-hero__meta">
                <span><Icon name="dashboard" size={16} />{t('landing.trust.secure')}</span>
                <span><Icon name="subscriptions" size={16} />{t('landing.trust.devices')}</span>
                <span><Icon name="support" size={16} />{t('landing.trust.support')}</span>
              </div>
            </div>

            <div className="landing-cabinet-preview" data-testid="landing-cabinet-preview">
              <aside
                aria-label={t('landing.accessibility.heroArtwork')}
                className="hero-preview"
                data-testid="landing-hero-preview"
              >
                <span aria-hidden="true" className="hero-preview__orb" />
                <HeroScene />
              </aside>
            </div>
          </div>
        </section>

        <ScrollReveal as="section" aria-labelledby="landing-trust-title" className="landing-section landing-trust" delay={0}>
          <div className="landing-section__heading">
            <h2 id="landing-trust-title">{t('landing.trust.title')}</h2>
          </div>
          <ul className="landing-trust__list">
            {TRUST_ITEMS.map(([icon, key]) => (
              <li key={key}><Icon name={icon} /><span>{t(key)}</span></li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal as="section" aria-labelledby="landing-features-title" className="landing-section" delay={40}>
          <LocationsSection />
        </ScrollReveal>

        <ScrollReveal
          as="section"
          aria-labelledby="landing-tariffs-title"
          className="landing-section"
          delay={80}
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
                      aria-label={`${t('landing.tariffs.select')} ${tariffName}`}
                      disabled={selectingTariff !== null}
                      onClick={() => void selectTariff(tariff.id)}
                      variant="primary"
                    >
                      {t('landing.tariffs.select')}
                    </Button>
                  </article>
                </li>
              );
            })}
          </ul>
        </ScrollReveal>

        <ScrollReveal
          as="section"
          aria-labelledby="landing-steps-title"
          className="landing-section"
          delay={120}
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
        </ScrollReveal>

        <ScrollReveal
          as="section"
          aria-labelledby="landing-faq-title"
          className="landing-section landing-faq"
          delay={160}
          id="faq"
          role="region"
          tabIndex={-1}
        >
          <div className="landing-section__heading">
            <h2 id="landing-faq-title">{t('landing.faq.title')}</h2>
          </div>
          <Accordion
            ariaLabel={t('landing.accessibility.faqList')}
            items={faqItems}
          />
        </ScrollReveal>
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
          </nav>
          <small>{t('landing.footer.copyright')}</small>
        </div>
      </footer>
    </div>
  );
}
