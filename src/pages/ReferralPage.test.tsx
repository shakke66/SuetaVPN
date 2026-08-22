import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';

const TELEGRAM_LINK = 'https://t.me/suetavpn_bot';

function openReferral() {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/referral';
  return render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);
}

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
  setClipboard();
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
});

afterEach(() => {
  setClipboard();
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
});

describe('Telegram-only referral flow', () => {
  it('shows four referral stats and the Telegram link without cabinet links or recent invitees', async () => {
    openReferral();

    expect(await screen.findByRole('heading', { name: 'Реферальная программа' })).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1 480 ₽')).toBeInTheDocument();
    expect(screen.getByText(TELEGRAM_LINK)).toBeInTheDocument();
    expect(screen.queryByText(/ссылка кабинета|cabinet link/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/последние приглаш[её]нные|recent invitees/i)).not.toBeInTheDocument();
  });

  it('uses the Clipboard API and falls back to an executable copy command', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    openReferral();

    await user.click(await screen.findByRole('button', { name: 'Копировать ссылку' }));
    expect(writeText).toHaveBeenCalledWith(TELEGRAM_LINK);
    expect(await screen.findByText('Ссылка скопирована')).toBeInTheDocument();

    setClipboard();
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    await user.click(screen.getByRole('button', { name: 'Копировать ссылку' }));
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('uses Web Share when available and copies the Telegram URL when it is unavailable', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    openReferral();

    const shareButton = await screen.findByRole('button', { name: 'Поделиться в Telegram' });
    await user.click(shareButton);
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: TELEGRAM_LINK }));

    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    fireEvent.click(shareButton);
    expect(writeText).toHaveBeenCalledWith(TELEGRAM_LINK);
  });
});
