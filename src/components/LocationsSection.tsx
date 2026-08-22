import type { JSX } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { Icon } from './Icon';

const CITIES = [
  'landing.locations.cityFrankfurt',
  'landing.locations.cityAmsterdam',
  'landing.locations.cityTallinn',
  'landing.locations.cityUsa',
  'landing.locations.cityFinland',
] as const satisfies readonly MessageKey[];

const BYPASS_ROWS = [
  ['landing.locations.bypassQuota', 'landing.locations.bypassQuotaNote'],
  ['landing.locations.bypassServers', 'landing.locations.bypassServersNote'],
  ['landing.locations.bypassCount', 'landing.locations.bypassCountNote'],
] as const satisfies ReadonlyArray<readonly [MessageKey, MessageKey]>;

/**
 * Секция локаций: бегущая лента городов и панель про обход.
 *
 * Лента дублирует список дважды и сдвигается ровно на половину ширины —
 * поэтому цикл стыкуется без рывка. При `prefers-reduced-motion` она замирает.
 */
export function LocationsSection(): JSX.Element {
  const { t } = useI18n();

  const tiles = (shifted: boolean) => (
    [...CITIES, ...CITIES].map((key, index) => (
      <span
        className="hl-tile"
        data-accent={index % 5 === (shifted ? 2 : 0)}
        key={`${key}-${index}`}
      >
        <Icon name="globe" size={16} />
        {t(key)}
      </span>
    ))
  );

  return (
    <div className="hl">
      <div className="hl__heading">
        <h2 id="landing-features-title">{t('landing.locations.title')}</h2>
      </div>

      <div className="hl__grid">
        <article className="hl-card">
          <div aria-hidden="true" className="hl-card__stage">
            <div className="hl-marquee">{tiles(false)}</div>
            <div className="hl-marquee hl-marquee--back">{tiles(true)}</div>
          </div>
          <div className="hl-card__text">
            <h3>{t('landing.locations.citiesTitle')}</h3>
            <p>{t('landing.locations.citiesText')}</p>
          </div>
        </article>

        <article className="hl-card">
          <div className="hl-card__stage">
            <div className="hl-panel">
              <span className="hl-panel__title">{t('landing.locations.bypassLabel')}</span>
              {BYPASS_ROWS.map(([titleKey, noteKey]) => (
                <div className="hl-row" key={titleKey}>
                  <span aria-hidden="true" className="hl-row__mark" />
                  <span>
                    <b>{t(titleKey)}</b>
                    <br />
                    <span>{t(noteKey)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="hl-card__text">
            <h3>{t('landing.locations.bypassTitle')}</h3>
            <p>{t('landing.locations.bypassText')}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
