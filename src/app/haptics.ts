interface TelegramHaptics {
  impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
}

interface TelegramWindow {
  Telegram?: { WebApp?: { HapticFeedback?: TelegramHaptics } };
}

/** Элементы, у которых есть действие: только на них отзывается телефон. */
const INTERACTIVE = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="radio"]',
  '[role="switch"]',
  'label[for]',
  'summary',
].join(',');

/**
 * Тактильный отклик мини-приложения. Нажатие ловим на всплытии, поэтому
 * работает и по пустому месту внутри плитки, а не только по её тексту.
 * Вне Telegram API нет — тогда обработчик просто молчит.
 */
export function startHaptics(): () => void {
  const onPointerDown = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(INTERACTIVE)) return;
    const haptics = (window as TelegramWindow).Telegram?.WebApp?.HapticFeedback;
    haptics?.impactOccurred?.('light');
  };

  document.addEventListener('pointerdown', onPointerDown, { passive: true });
  return () => document.removeEventListener('pointerdown', onPointerDown);
}
