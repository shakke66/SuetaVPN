import type { JSX, KeyboardEventHandler } from 'react';
import type { Tariff } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

interface TariffCardProps {
  tariff: Tariff;
  selected: boolean;
  onSelect: (tariff: Tariff) => void;
  onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
  tabIndex: number;
}

export function TariffCard({ tariff, selected, onSelect, onKeyDown, tabIndex }: TariffCardProps): JSX.Element {
  const { formatMoney, t } = useI18n();
  const copy = tariff.id === 'elite' ? 'elite' : 'base';

  const traffic = tariff.traffic.kind === 'bypass'
    ? t('tariffs.elite.trafficShort', { amount: tariff.traffic.bypassGb })
    : t('tariffs.base.trafficShort');

  const facts = [
    [t('purchase.facts.traffic'), traffic],
    [t('purchase.facts.devices'), t(`tariffs.${copy}.devicesShort`, { amount: tariff.devices })],
    [t('purchase.facts.locations'), String(tariff.locations)],
    [t('purchase.facts.speed'), t(`tariffs.${copy}.speedShort`, { amount: tariff.speedGbps })],
  ] as const;

  return (
    <button
      aria-checked={selected}
      aria-label={t(`tariffs.${copy}.name`)}
      className="tariff-card"
      data-selected={selected}
      onKeyDown={onKeyDown}
      onClick={() => onSelect(tariff)}
      role="radio"
      tabIndex={tabIndex}
      type="button"
    >
      <span className="tariff-card__topline">
        <span className="tariff-card__plan" data-tariff={tariff.id}>{t(`tariffs.${copy}.name`)}</span>
        <span className="tariff-card__price">
          <strong>{formatMoney(tariff.prices[1])}</strong>
          <span>{t('tariffs.perMonthSuffix')}</span>
        </span>
      </span>

      <span className="tariff-card__description">{t(`tariffs.${copy}.description`)}</span>

      <span className="tariff-card__facts">
        {facts.map(([label, value]) => (
          <span className="tariff-card__fact" key={label}>
            <span className="tariff-card__fact-label">{label}</span>
            <span className="tariff-card__fact-value">{value}</span>
          </span>
        ))}
      </span>
    </button>
  );
}
