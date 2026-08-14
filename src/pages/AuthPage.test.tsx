import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { App } from '../app/App';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

const NOW = Date.parse('2026-08-14T10:00:00.000Z');
const VERIFICATION_CODE = '482731';

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: {
          id: number;
          first_name?: string;
          last_name?: string;
          username?: string;
        };
      };
      user?: { id: number; first_name?: string };
    };
  };
}

function setHash(path: string) {
  window.location.hash = path;
}

function persistedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted application state');
  return JSON.parse(raw) as AppStateV2;
}

function renderApp({
  path = '/auth',
  delayMs = 0,
  now = () => new Date(NOW).toISOString(),
}: {
  path?: string;
  delayMs?: number;
  now?: () => string;
} = {}) {
  setHash(path);
  const adapters = createLocalAdapters({
    delayMs,
    now,
    verificationCodeSource: () => VERIFICATION_CODE,
  });
  return render(<App adapters={adapters} />);
}

beforeEach(() => {
  localStorage.clear();
  delete (window as TelegramWindow).Telegram;
  setHash('/');
});

describe('protected hash routing', () => {
  it.each([
    ['/dashboard', 'Главная'],
    ['/subscriptions', 'Подписки'],
    ['/purchase', 'Оформление подписки'],
    ['/balance', 'Баланс'],
    ['/referral', 'Рефералы'],
    ['/support', 'Поддержка'],
    ['/info', 'Информация'],
    ['/profile', 'Профиль'],
  ])('declares the protected %s child route', async (path, heading) => {
    const stored = createInitialState();
    stored.session = { active: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    renderApp({ path });

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(window.location.hash).toBe(`#${path}`);
  });

  it.each([
    [false, 'SuetaVPN', '#/'],
    [true, 'Главная', '#/dashboard'],
  ])(
    'redirects an unknown route according to session.active=%s',
    async (active, heading, expectedHash) => {
      const stored = createInitialState();
      stored.session = { active };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      renderApp({ path: '/unknown' });

      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
      expect(window.location.hash).toBe(expectedHash);
    },
  );

  it('redirects an unauthenticated protected URL to auth and returns there after Telegram login', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/balance', delayMs: 30 });

    expect(await screen.findByRole('heading', { name: 'Вход в SuetaVPN' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/auth');

    await user.click(screen.getByRole('button', { name: 'Продолжить с Telegram' }));
    expect(screen.getByRole('button', { name: 'Открываем Telegram' })).toBeDisabled();

    expect(await screen.findByRole('heading', { name: 'Баланс' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/balance');
    expect(persistedState().session.active).toBe(true);
  });

  it('redirects the legacy welcome URL to the public landing route', async () => {
    renderApp({ path: '/welcome' });

    expect(await screen.findByRole('heading', { name: 'SuetaVPN' })).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/'));
  });

  it('supports browser logout and protects the previous cabinet URL again', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/dashboard' });

    await user.click(await screen.findByRole('button', { name: 'Продолжить с Telegram' }));
    expect(await screen.findByRole('heading', { name: 'Главная' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Выйти' }));

    expect(await screen.findByRole('heading', { name: 'SuetaVPN' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/');
    await waitFor(() => expect(persistedState().session.active).toBe(false));

    setHash('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Вход в SuetaVPN' })).toBeInTheDocument();
  });
});

describe('email authorization', () => {
  it('offers login and registration tabs and reports an invalid email next to the field', async () => {
    const user = userEvent.setup();
    renderApp();

    const loginTab = screen.getByRole('tab', { name: 'Войти' });
    const registerTab = screen.getByRole('tab', { name: 'Создать аккаунт' });
    expect(loginTab).toHaveAttribute('aria-selected', 'true');

    await user.click(registerTab);
    expect(registerTab).toHaveAttribute('aria-selected', 'true');
    expect(loginTab).toHaveAttribute('aria-selected', 'false');

    await user.type(screen.getByRole('textbox', { name: 'Электронная почта' }), 'invalid@');
    await user.click(screen.getByRole('button', { name: 'Получить код' }));

    expect(await screen.findByText('Введите корректный адрес')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Локальная проверка' })).not.toBeInTheDocument();
  });

  it('shows an honest local challenge and validates code shape and value', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByRole('textbox', { name: 'Электронная почта' }), 'mira@example.com');
    await user.click(screen.getByRole('button', { name: 'Получить код' }));

    const panel = await screen.findByRole('region', { name: 'Локальная проверка' });
    expect(panel).toHaveTextContent('Используйте этот код для входа в текущем браузере');
    expect(panel).toHaveTextContent(`Код: ${VERIFICATION_CODE}`);
    expect(document.body).not.toHaveTextContent(/письм|отправлен/i);

    const codeInput = screen.getByRole('textbox', { name: 'Код подтверждения' });
    await user.type(codeInput, '12345');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));
    expect(await screen.findByText('Код должен содержать шесть цифр')).toBeInTheDocument();

    await user.clear(codeInput);
    await user.type(codeInput, '111111');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));
    expect(await screen.findByText('Неверный код')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/auth');
  });

  it('rejects an expired local verification code', async () => {
    const user = userEvent.setup();
    let currentTime = NOW;
    renderApp({ now: () => new Date(currentTime).toISOString() });

    await user.type(screen.getByRole('textbox', { name: 'Электронная почта' }), 'mira@example.com');
    await user.click(screen.getByRole('button', { name: 'Получить код' }));
    await screen.findByRole('region', { name: 'Локальная проверка' });

    currentTime += 11 * 60 * 1000;
    await user.type(screen.getByRole('textbox', { name: 'Код подтверждения' }), VERIFICATION_CODE);
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));

    expect(await screen.findByText('Срок действия кода истёк')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/auth');
  });

  it('verifies a current code, persists the email profile and returns to the requested route', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/support' });

    await screen.findByRole('heading', { name: 'Вход в SuetaVPN' });
    await user.type(screen.getByRole('textbox', { name: 'Электронная почта' }), 'mira@example.com');
    await user.click(screen.getByRole('button', { name: 'Получить код' }));
    await user.type(await screen.findByRole('textbox', { name: 'Код подтверждения' }), VERIFICATION_CODE);
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));

    expect(await screen.findByRole('heading', { name: 'Поддержка' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/support');
    expect(persistedState()).toMatchObject({
      session: { active: true },
      profile: { email: 'mira@example.com', emailVerified: true },
    });
  });
});

describe('Telegram Mini App authorization', () => {
  it('auto-authorizes only initDataUnsafe.user, explains backend validation and omits logout', async () => {
    (window as TelegramWindow).Telegram = {
      WebApp: {
        initDataUnsafe: {
          user: { id: 42, first_name: 'Mira', last_name: 'K', username: 'mira' },
        },
      },
    };
    renderApp({ path: '/profile' });

    expect(await screen.findByRole('heading', { name: 'Профиль' })).toBeInTheDocument();
    expect(screen.getByText(/будущий backend должен проверить данные Telegram/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Выйти' })).not.toBeInTheDocument();
    expect(persistedState()).toMatchObject({
      session: { active: true },
      profile: { name: 'Mira K', username: '@mira' },
    });
  });

  it('does not treat other Telegram window fields as a verified Mini App user', async () => {
    (window as TelegramWindow).Telegram = {
      WebApp: { user: { id: 42, first_name: 'Mira' } },
    };
    renderApp({ path: '/profile' });

    expect(await screen.findByRole('heading', { name: 'Вход в SuetaVPN' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/auth');
    expect(screen.getByRole('button', { name: 'Продолжить с Telegram' })).toBeInTheDocument();
  });
});
