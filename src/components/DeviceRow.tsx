import type { JSX } from 'react';
import type { Device } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

/** Строка списка устройств. Одна на главную и на вкладку подписки. */
export function DeviceRow({ device }: { device: Device }): JSX.Element {
  const { formatDate, t } = useI18n();

  return (
    <li className="device-row">
      <span className="device-row__name">
        <strong>{device.name}</strong>
        <span>{device.platform}</span>
      </span>
      <span className="device-row__seen">
        {device.online
          ? t('subscriptions.online')
          : t('subscriptions.lastSeen', { amount: formatDate(device.lastSeenAt) })}
      </span>
    </li>
  );
}
