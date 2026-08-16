import { useId, type JSX, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Accordion } from '../components/Accordion';
import { Button } from '../components/Button';
import { useI18n } from '../i18n/I18nProvider';

const TABS = ['faq', 'agreement', 'privacy'] as const;
type InfoTab = typeof TABS[number];

function requestedTab(value: string | null): InfoTab {
  return TABS.includes(value as InfoTab) ? value as InfoTab : 'faq';
}

function moveTab(
  event: KeyboardEvent<HTMLButtonElement>,
  currentIndex: number,
  select: (tab: InfoTab) => void,
): void {
  let nextIndex: number | null = null;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = TABS.length - 1;
  if (nextIndex === null) return;
  event.preventDefault();
  select(TABS[nextIndex]);
  event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLElement>('[role="tab"]').item(nextIndex).focus();
}

export function InfoPage(): JSX.Element {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = requestedTab(searchParams.get('tab'));
  const id = useId();
  const selectTab = (tab: InfoTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };
  const faqItems = [
    { id: 'connection', title: t('info.faq.connection'), content: <p>{t('info.faq.connectionAnswer')}</p> },
    { id: 'renewal', title: t('info.faq.renewal'), content: <p>{t('info.faq.renewalAnswer')}</p> },
  ];

  return (
    <section className="info-page">
      <div className="page-heading"><h1>{t('info.title')}</h1></div>
      <div aria-label={t('info.title')} className="info-tabs" role="tablist">
        {TABS.map((tab, index) => (
          <Button
            aria-controls={`${id}-${tab}-panel`}
            aria-selected={activeTab === tab}
            id={`${id}-${tab}-tab`}
            key={tab}
            onClick={() => selectTab(tab)}
            onKeyDown={(event) => moveTab(event, index, selectTab)}
            role="tab"
            tabIndex={activeTab === tab ? 0 : -1}
            variant="utility"
          >
            {t(`info.tabs.${tab}`)}
          </Button>
        ))}
      </div>
      <section
        aria-labelledby={`${id}-${activeTab}-tab`}
        className="info-panel"
        id={`${id}-${activeTab}-panel`}
        role="tabpanel"
      >
        {activeTab === 'faq' ? (
          <div className="info-faq">
            <h2>{t('info.faq.title')}</h2>
            <Accordion ariaLabel={t('info.faq.title')} items={faqItems} />
          </div>
        ) : (
          <div className="document-placeholder">
            <h2>{t(`info.${activeTab}.title`)}</h2>
            <p>{t(`info.${activeTab}.placeholder`)}</p>
          </div>
        )}
      </section>
    </section>
  );
}
