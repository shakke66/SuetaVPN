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
  const copy = tariff.id === 'base' ? 'base' : 'elite';
  const traffic = tariff.traffic.kind === 'unlimited'
    ? t(`tariffs.${copy}.traffic`)
    : t(`tariffs.${copy}.traffic`, { amount: tariff.traffic.bypassGb });

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
        <strong>{t(`tariffs.${copy}.name`)}</strong>
        <span>{formatMoney(tariff.prices[1])}</span>
      </span>
      <span className="tariff-card__description">{t(`tariffs.${copy}.description`)}</span>
      <span className="tariff-card__facts">
        <span>{traffic}</span>
        <span>{t(`tariffs.${copy}.devices`, { amount: tariff.devices })}</span>
        <span>{t(`tariffs.${copy}.locations`, { amount: tariff.locations })}</span>
        <span>{t(`tariffs.${copy}.speed`, { amount: tariff.speedGbps })}</span>
        <span>{t(`tariffs.${copy}.platforms`)}</span>
        {tariff.id === 'elite' ? <span>{t('tariffs.elite.regularServers')}</span> : null}
      </span>
    </button>
  );
}
