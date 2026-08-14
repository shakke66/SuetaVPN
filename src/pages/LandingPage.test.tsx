import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

function persistedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted application state');
  return JSON.parse(raw) as AppStateV2;
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('public landing', () => {
  it('renders the complete Russian composition with exactly the current catalog plans', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Интернет на вашей стороне' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Соединение, которому можно доверять' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Всё необходимое' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Подключение за три шага' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Помощь в нужный момент' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Нас выбирают за простоту' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Частые вопросы' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    const planList = screen.getByRole('list', { name: 'Список тарифов' });
    const plans = within(planList).getAllByRole('article');
    expect(plans).toHaveLength(2);
    expect(within(plans[0]).getByRole('heading', { name: 'БАЗА' })).toBeInTheDocument();
    expect(within(plans[0]).getByText(/250\s₽/)).toBeInTheDocument();
    expect(within(plans[0]).getByText('До 4 устройств')).toBeInTheDocument();
    expect(within(plans[1]).getByRole('heading', { name: 'ЭЛИТА' })).toBeInTheDocument();
    expect(within(plans[1]).getByText(/310\s₽/)).toBeInTheDocument();
    expect(within(plans[1]).getByText('40 ГБ обходного трафика')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/СТАРТ|СЕМЬЯ|DEMO|демо|демонстрацион/i);
  });

  it('starts with the first FAQ answer open and supports multiple open answers', async () => {
    const user = userEvent.setup();
    render(<App />);

    const first = await screen.findByRole('button', { name: 'Как подключить устройство?' });
    const second = screen.getByRole('button', { name: 'Какие способы оплаты доступны?' });
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'false');

    await user.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('retains a valid current period, stores the selected plan through the provider and routes to auth', async () => {
    const stored = createInitialState();
    stored.purchaseDraft = { tariffId: 'base', months: 12 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Выбрать ЭЛИТА' }));

    expect(await screen.findByRole('heading', { name: 'Вход в SuetaVPN' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/auth');
    await waitFor(() => expect(persistedState().purchaseDraft).toEqual({ tariffId: 'elite', months: 12 }));
  });

  it('offers working navigation, theme and locale controls without leaving the public route', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(within(await screen.findByRole('banner')).getByRole('link', { name: 'SuetaVPN' })).toHaveAttribute('href', '#/');
    const tariffsLink = screen.getByRole('link', { name: 'Тарифы' });
    expect(tariffsLink).toHaveAttribute('href', '#tariffs');
    expect(screen.getByRole('link', { name: 'Вопросы' })).toHaveAttribute('href', '#faq');
    expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '#/auth');
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Поддержка' })).toHaveAttribute('href', '#/support');

    await user.click(tariffsLink);
    expect(screen.getByRole('region', { name: 'Выберите свой тариф' })).toHaveFocus();
    expect(window.location.hash).toBe('#/');

    await user.click(screen.getByRole('button', { name: 'Включить светлую тему' }));
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'light'));

    await user.click(screen.getByRole('button', { name: 'Переключить на английский' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'The internet on your side' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(window.location.hash).toBe('#/');
  });
});
