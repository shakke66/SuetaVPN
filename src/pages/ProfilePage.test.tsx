import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { App } from '../app/App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

function storedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted application state');
  return JSON.parse(raw) as AppStateV2;
}

function openProfile(update: (state: AppStateV2) => void = () => undefined) {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  update(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/profile';
  return render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);
}

function main() {
  return within(screen.getByRole('main'));
}

const AVATAR_DATA_URL = 'data:image/jpeg;base64,AAAA';

/** jsdom не умеет ни декодировать картинки, ни рисовать на canvas — подменяем оба шага. */
function stubImagePipeline() {
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ close: vi.fn(), height: 800, width: 1200 })));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(AVATAR_DATA_URL);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('profile screen', () => {
  it('shows the account, sign-in methods and account summary tiles', async () => {
    openProfile((state) => { state.profile.email = 'alexey@example.test'; state.profile.emailVerified = true; });

    expect(await screen.findByRole('heading', { level: 1, name: 'Профиль' })).toBeInTheDocument();
    const account = within(screen.getByRole('region', { name: 'Аккаунт' }));
    expect(account.getByText('Алексей')).toBeInTheDocument();
    expect(account.getByText('@sueta')).toBeInTheDocument();
    expect(account.getByText('Пользователь')).toBeInTheDocument();

    const signIn = within(screen.getByRole('region', { name: 'Способы входа' }));
    expect(signIn.getByText('Telegram')).toBeInTheDocument();
    expect(signIn.getByText('alexey@example.test')).toBeInTheDocument();
    expect(signIn.getByText('Подтверждена')).toBeInTheDocument();
    expect(signIn.queryByRole('button', { name: 'Добавить почту' })).not.toBeInTheDocument();

    expect(main().getByRole('link', { name: /^Баланс: 790\s₽$/ })).toHaveAttribute('href', '#/balance');
    expect(main().getByRole('link', { name: 'Устройства: 2/4' })).toHaveAttribute('href', '#/subscriptions');
  });

  it('switches theme and locale from the settings card', async () => {
    const user = userEvent.setup();
    openProfile();

    const settings = within(await screen.findByRole('region', { name: 'Настройки' }));
    const theme = settings.getByRole('switch', { name: 'Тёмная тема' });
    expect(theme).toBeChecked();

    await user.click(theme);
    await waitFor(() => expect(storedState().preferences.theme).toBe('light'));

    await user.click(settings.getByRole('radio', { name: 'EN' }));
    await waitFor(() => expect(storedState().preferences.locale).toBe('en'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
  });

  it('attaches an email through the dialog and shows it as verified', async () => {
    const user = userEvent.setup();
    openProfile();

    const signIn = within(await screen.findByRole('region', { name: 'Способы входа' }));
    expect(signIn.getByText('Не указана')).toBeInTheDocument();
    await user.click(signIn.getByRole('button', { name: 'Добавить почту' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Добавление почты' }));
    await user.type(dialog.getByLabelText('Электронная почта'), 'mira@example.com');
    await user.click(dialog.getByRole('button', { name: 'Получить код' }));

    const code = issuedCode();
    await user.type(await screen.findByRole('textbox', { name: 'Код подтверждения' }), code);
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));

    await waitFor(() => expect(storedState().profile).toMatchObject({
      email: 'mira@example.com',
      emailVerified: true,
    }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Способы входа' })).getByText('mira@example.com')).toBeInTheDocument();
  });

  it('stores an uploaded avatar downscaled and lets it be removed again', async () => {
    stubImagePipeline();
    const user = userEvent.setup();
    openProfile();

    const account = within(await screen.findByRole('region', { name: 'Аккаунт' }));
    await user.upload(
      account.getByLabelText('Выберите изображение для аватара'),
      new File(['photo'], 'me.png', { type: 'image/png' }),
    );

    await waitFor(() => expect(storedState().profile.avatar).toBe(AVATAR_DATA_URL));
    expect(account.getByRole('button', { name: 'Заменить фото' })).toBeInTheDocument();

    await user.click(account.getByRole('button', { name: 'Удалить' }));
    await waitFor(() => expect(storedState().profile.avatar).toBeNull());
  });

  it('rejects a wrong verification code without attaching the email', async () => {
    const user = userEvent.setup();
    openProfile();

    await user.click(within(await screen.findByRole('region', { name: 'Способы входа' })).getByRole('button', { name: 'Добавить почту' }));
    await user.type(screen.getByLabelText('Электронная почта'), 'mira@example.com');
    await user.click(screen.getByRole('button', { name: 'Получить код' }));

    await user.type(await screen.findByRole('textbox', { name: 'Код подтверждения' }), '000000');
    await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный код');
    expect(storedState().profile.email).toBe('');
  });
});

/** Писем сервис не шлёт: код выдаётся прямо в диалоге, оттуда его и берём. */
function issuedCode(): string {
  return (screen.getByRole('status').textContent ?? '').replace(/\D/g, '');
}
