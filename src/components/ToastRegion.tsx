import { useState, type JSX } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Icon } from './Icon';

export interface ToastMessage {
  id: string;
  kind: 'error' | 'info' | 'success';
  text: string;
  /** Предупреждения, которые нельзя пропустить, не гаснут сами. */
  sticky?: boolean;
}

interface ToastRegionProps {
  messages: readonly ToastMessage[];
  onDismiss: (id: string) => void;
}

const GLYPH = { error: '!', info: 'i', success: '✓' } as const;

/** Столько живёт анимация ухода — после неё сообщение выбрасывается из списка. */
const EXIT_MS = 240;

export function ToastRegion({ messages, onDismiss }: ToastRegionProps): JSX.Element {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState<readonly string[]>([]);

  const close = (id: string) => {
    if (leaving.includes(id)) return;
    setLeaving((current) => [...current, id]);
    window.setTimeout(() => {
      setLeaving((current) => current.filter((item) => item !== id));
      onDismiss(id);
    }, EXIT_MS);
  };

  return (
    <div aria-live="polite" aria-relevant="additions removals" className="toast-region">
      {messages.map((message) => (
        <article
          className={`toast toast--${message.kind}`}
          data-leaving={leaving.includes(message.id) ? 'true' : undefined}
          key={message.id}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          <span aria-hidden="true" className="toast__glyph">{GLYPH[message.kind]}</span>
          <span className="toast__text">{message.text}</span>
          <button
            aria-label={t('toast.dismiss')}
            className="toast__close"
            onClick={() => close(message.id)}
            type="button"
          >
            <Icon name="close" size={16} />
          </button>
          {message.sticky ? null : (
            <span aria-hidden="true" className="toast__track">
              {/* Полоса и есть таймер: её анимация замирает под курсором,
                  а когда доходит до конца — уведомление уходит. */}
              <span className="toast__bar" onAnimationEnd={() => close(message.id)} />
            </span>
          )}
        </article>
      ))}
    </div>
  );
}
