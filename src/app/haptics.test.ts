import { afterEach, describe, expect, it, vi } from 'vitest';
import { startHaptics } from './haptics';

interface TelegramMock {
  WebApp: { HapticFeedback: { impactOccurred: (style: string) => void } };
}

function withTelegram(): { impact: ReturnType<typeof vi.fn>; stop: () => void } {
  const impact = vi.fn();
  (window as unknown as { Telegram?: TelegramMock }).Telegram = {
    WebApp: { HapticFeedback: { impactOccurred: impact } },
  };
  return { impact, stop: startHaptics() };
}

afterEach(() => {
  delete (window as unknown as { Telegram?: TelegramMock }).Telegram;
  document.body.innerHTML = '';
});

describe('тактильный отклик', () => {
  it('отзывается на нажатие кнопки', () => {
    const { impact, stop } = withTelegram();
    document.body.innerHTML = '<button type="button">Продлить</button>';

    document.querySelector('button')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(impact).toHaveBeenCalledWith('light');
    stop();
  });

  it('отзывается на нажатие по любому месту интерактивной плитки, а не только по её тексту', () => {
    const { impact, stop } = withTelegram();
    document.body.innerHTML = '<a class="dashboard-tile" href="#/balance"><span>Баланс</span></a>';

    document.querySelector('span')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(impact).toHaveBeenCalledWith('light');
    stop();
  });

  it('молчит на обычном тексте — отклик только там, где есть действие', () => {
    const { impact, stop } = withTelegram();
    document.body.innerHTML = '<p>Осталось 24 дня</p>';

    document.querySelector('p')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(impact).not.toHaveBeenCalled();
    stop();
  });

  it('не падает вне Telegram: в браузере такого API нет', () => {
    const stop = startHaptics();
    document.body.innerHTML = '<button type="button">Продлить</button>';

    expect(() => {
      document.querySelector('button')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    }).not.toThrow();
    stop();
  });
});
