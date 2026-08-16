import type { JSX } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Icon } from './Icon';

export interface ToastMessage {
  id: string;
  kind: 'error' | 'info' | 'success';
  text: string;
}

interface ToastRegionProps {
  messages: readonly ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastRegion({ messages, onDismiss }: ToastRegionProps): JSX.Element {
  const { t } = useI18n();
  return (
    <div aria-live="polite" aria-relevant="additions removals" className="toast-region">
      {messages.map((message) => (
        <section className={`toast toast--${message.kind}`} key={message.id} role={message.kind === 'error' ? 'alert' : 'status'}>
          <span>{message.text}</span>
          <Button aria-label={t('toast.dismiss')} iconOnly onClick={() => onDismiss(message.id)} variant="utility">
            <Icon name="close" size={18} />
          </Button>
        </section>
      ))}
    </div>
  );
}
