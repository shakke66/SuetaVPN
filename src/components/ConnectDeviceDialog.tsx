import { useState, type JSX, type RefObject } from 'react';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Modal } from './Modal';

const PLATFORMS = [
  { id: 'windows', key: 'connectDialog.windows' },
  { id: 'macos', key: 'connectDialog.macos' },
  { id: 'ios', key: 'connectDialog.ios' },
  { id: 'android', key: 'connectDialog.android' },
  { id: 'router', key: 'connectDialog.router' },
] as const satisfies ReadonlyArray<Readonly<{ id: string; key: MessageKey }>>;

interface ConnectDeviceDialogProps {
  onClose: () => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function ConnectDeviceDialog({ onClose, open, returnFocusRef }: ConnectDeviceDialogProps): JSX.Element {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]['id']>('windows');
  const current = PLATFORMS.find(({ id }) => id === platform) ?? PLATFORMS[0];

  return (
    <Modal onClose={onClose} open={open} returnFocusRef={returnFocusRef} title={t('connectDialog.title')}>
      <p>{t('connectDialog.description')}</p>
      <div aria-label={t('connectDialog.accessibility.platformList')} className="connect-dialog__platforms" role="list">
        {PLATFORMS.map(({ id, key }) => (
          <Button aria-pressed={platform === id} key={id} onClick={() => setPlatform(id)} variant="utility">
            {t(key)}
          </Button>
        ))}
      </div>
      <p className="connect-dialog__selection" role="status">
        {t('connectDialog.selected', { platform: t(current.key) })}
      </p>
    </Modal>
  );
}
