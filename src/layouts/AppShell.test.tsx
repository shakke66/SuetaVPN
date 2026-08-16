import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { App } from '../app/App';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: { id: number; first_name?: string; username?: string };
      };
    };
  };
}

function activeState(): AppStateV2 {
  const state = createInitialState();
  state.session = { active: true };
  state.preferences.onboardingCompleted = true;
  state.wallet.transactions = [
    ...state.wallet.transactions,
    {
      id: 'transaction-general',
      type: 'promo',
      amount: 100,
      description: 'Общее событие баланса',
      date: '2026-08-14T09:00:00.000Z',
      status: 'completed',
    },
  ];
  state.notifications = [
    {
      id: 'notification-replied',
      type: 'ticket-replied',
      ticketId: 'ticket-current',
      read: false,
      readAt: null,
      createdAt: '2026-08-14T10:00:00.000Z',
    },
    {
      id: 'notification-created',
      type: 'ticket-created',
      ticketId: 'ticket-current',
      read: false,
      readAt: null,
      createdAt: '2026-08-13T10:00:00.000Z',
    },
  ];
  return state;
}

function persistedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted application state');
  return JSON.parse(raw) as AppStateV2;
}

function renderCabinet(path = '/dashboard', state = activeState()) {
  window.location.hash = path;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '/';
  delete (window as TelegramWindow).Telegram;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('persistent application shell', () => {
  it('keeps the header node mounted while route content and active navigation change', async () => {
    const user = userEvent.setup();
    renderCabinet();

    await screen.findByRole('heading', { name: 'Главная' });
    const header = screen.getByTestId('app-shell-header');

    const mobileNavigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    await user.click(within(mobileNavigation).getByRole('link', { name: 'Баланс' }));

    expect(await screen.findByRole('heading', { name: 'Баланс' })).toBeInTheDocument();
    expect(screen.getByTestId('app-shell-header')).toBe(header);
    expect(within(mobileNavigation).getByRole('link', { name: 'Баланс' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(window.location.hash).toBe('#/balance');
  });

  it('renders the exact five-item mobile navigation order', async () => {
    renderCabinet();

    await screen.findByRole('heading', { name: 'Главная' });
    const navigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    expect(within(navigation).getAllByRole('link').map((link) => link.textContent?.trim())).toEqual([
      'Главная',
      'Подписки',
      'Баланс',
      'Рефералы',
      'Поддержка',
    ]);
  });

  it('shows only ticket events and marks every unread notification as read', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const bell = await screen.findByRole('button', { name: 'Открыть уведомления' });
    expect(bell).toHaveAccessibleName('Открыть уведомления');
    expect(screen.getByText('2')).toHaveAccessibleName('Непрочитанных уведомлений: 2');

    await user.click(bell);
    const panel = screen.getByRole('dialog', { name: 'Уведомления о тикетах' });
    expect(panel).toHaveTextContent('Получен ответ по обращению «Как подключить устройство?»');
    expect(panel).toHaveTextContent('Обращение «Как подключить устройство?» создано');
    expect(panel).not.toHaveTextContent('Общее событие баланса');

    await user.click(within(panel).getByRole('button', { name: 'Прочитать все' }));

    await waitFor(() => {
      expect(persistedState().notifications.every(({ read }) => read)).toBe(true);
    });
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('anchors the desktop notification popover to the actual bell and clamps it to the viewport', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(800);
    renderCabinet();

    const header = await screen.findByTestId('app-shell-header');
    const opener = within(header).getByRole('button', { name: 'Открыть уведомления' });
    let openerRect = {
      bottom: 56,
      height: 44,
      left: 600,
      right: 644,
      top: 12,
      width: 44,
      x: 600,
      y: 12,
      toJSON: () => ({}),
    } as DOMRect;
    vi.spyOn(opener, 'getBoundingClientRect').mockImplementation(() => openerRect);

    await user.click(opener);
    const popover = screen.getByRole('dialog', { name: 'Уведомления о тикетах' });
    expect(popover).toHaveAttribute('data-anchor', 'desktop');
    expect(popover).toHaveStyle({ left: '254px', top: '68px' });

    openerRect = {
      ...openerRect,
      left: 755,
      right: 799,
      x: 755,
    };
    fireEvent(window, new Event('resize'));

    expect(popover).toHaveStyle({ left: '394px', top: '68px' });
  });

  it('closes the mobile drawer with Escape and returns focus to its trigger', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const trigger = await screen.findByRole('button', { name: 'Открыть меню' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Меню' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Меню' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('cycles focus in both directions inside the modal drawer', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const trigger = await screen.findByRole('button', { name: 'Открыть меню' });
    await user.click(trigger);
    const drawer = screen.getByRole('dialog', { name: 'Меню' });
    const closeButton = within(drawer).getByRole('button', { name: 'Закрыть меню' });
    const lastButton = within(drawer).getByRole('button', { name: 'Выйти' });
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('returns ticket popover focus to the actual drawer opener on Escape and outside click', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const header = await screen.findByTestId('app-shell-header');
    const desktopOpener = within(header).getByRole('button', { name: 'Открыть уведомления' });

    await user.click(within(header).getByRole('button', { name: 'Открыть меню' }));
    const drawer = screen.getByRole('dialog', { name: 'Меню' });
    const drawerOpener = within(drawer).getByRole('button', { name: 'Открыть уведомления' });

    await user.click(drawerOpener);
    expect(screen.getByRole('dialog', { name: 'Уведомления о тикетах' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.getByRole('dialog', { name: 'Меню' })).toBeInTheDocument();
    expect(drawerOpener).toHaveFocus();
    expect(desktopOpener).not.toHaveFocus();

    await user.click(drawerOpener);
    expect(screen.getByRole('dialog', { name: 'Уведомления о тикетах' })).toBeInTheDocument();
    fireEvent.pointerDown(header);

    expect(screen.queryByRole('dialog', { name: 'Уведомления о тикетах' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Меню' })).toBeInTheDocument();
    expect(drawerOpener).toHaveFocus();
    expect(desktopOpener.closest('.shell-desktop-only')).not.toBeNull();
    expect(drawerOpener).toHaveAttribute('data-notification-opener', 'drawer');
  });

  it('transfers modal ownership to drawer notifications and restores the drawer trap on close', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const menuTrigger = await screen.findByRole('button', { name: 'Открыть меню' });
    await user.click(menuTrigger);
    const drawer = screen.getByRole('dialog', { name: 'Меню' });
    const drawerOpener = within(drawer).getByRole('button', { name: 'Открыть уведомления' });

    await user.click(drawerOpener);
    const popover = screen.getByRole('dialog', { name: 'Уведомления о тикетах' });
    const modalDialogs = screen.getAllByRole('dialog').filter(
      (dialog) => dialog.getAttribute('aria-modal') === 'true',
    );
    expect(modalDialogs).toEqual([popover]);
    expect(drawer).not.toHaveAttribute('aria-modal');
    expect(popover).toHaveAttribute('aria-modal', 'true');

    await user.keyboard('{Escape}');

    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawerOpener).toHaveFocus();

    const closeButton = within(drawer).getByRole('button', { name: 'Закрыть меню' });
    const lastButton = within(drawer).getByRole('button', { name: 'Выйти' });
    closeButton.focus();
    await user.tab({ shift: true });
    expect(lastButton).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab inside drawer notification modal boundaries', async () => {
    const user = userEvent.setup();
    renderCabinet();

    await user.click(await screen.findByRole('button', { name: 'Открыть меню' }));
    const drawer = screen.getByRole('dialog', { name: 'Меню' });
    await user.click(within(drawer).getByRole('button', { name: 'Открыть уведомления' }));

    const popover = screen.getByRole('dialog', { name: 'Уведомления о тикетах' });
    const firstButton = within(popover).getByRole('button', { name: 'Закрыть' });
    const lastButton = within(popover).getByRole('button', { name: 'Прочитать все' });
    expect(firstButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastButton).toHaveFocus();

    await user.tab();
    expect(firstButton).toHaveFocus();
  });

  it('isolates shell regions for drawer notification modality and restores them before focus', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const header = await screen.findByTestId('app-shell-header');
    const main = document.getElementById('main-content');
    const bottomNavigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    await user.click(within(header).getByRole('button', { name: 'Открыть меню' }));
    const drawer = screen.getByRole('dialog', { name: 'Меню' });
    const drawerBackdrop = drawer.closest('.drawer-backdrop');
    const drawerOpener = within(drawer).getByRole('button', { name: 'Открыть уведомления' });

    await user.click(drawerOpener);

    for (const region of [header, main, bottomNavigation, drawerBackdrop]) {
      expect(region).toHaveAttribute('aria-hidden', 'true');
      expect(region).toHaveAttribute('inert');
    }

    await user.keyboard('{Escape}');

    for (const region of [header, main, bottomNavigation, drawerBackdrop]) {
      expect(region).not.toHaveAttribute('aria-hidden');
      expect(region).not.toHaveAttribute('inert');
    }
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawerOpener).toHaveFocus();
  });

  it('keeps desktop notifications nonmodal and leaves the page interactive on outside close', async () => {
    const user = userEvent.setup();
    renderCabinet();

    const header = await screen.findByTestId('app-shell-header');
    const main = document.getElementById('main-content');
    const bottomNavigation = screen.getByRole('navigation', { name: 'Основная навигация' });
    const desktopOpener = within(header).getByRole('button', { name: 'Открыть уведомления' });

    await user.click(desktopOpener);
    expect(screen.getByRole('dialog', { name: 'Уведомления о тикетах' })).toHaveAttribute(
      'aria-modal',
      'false',
    );
    for (const region of [header, main, bottomNavigation]) {
      expect(region).not.toHaveAttribute('aria-hidden');
      expect(region).not.toHaveAttribute('inert');
    }

    if (!main) throw new Error('expected route viewport');
    fireEvent.pointerDown(main);

    expect(screen.queryByRole('dialog', { name: 'Уведомления о тикетах' })).not.toBeInTheDocument();
    expect(desktopOpener).toHaveFocus();
  });

  it('omits logout controls inside a Telegram Mini App', async () => {
    (window as TelegramWindow).Telegram = {
      WebApp: {
        initDataUnsafe: { user: { id: 42, first_name: 'Мира', username: 'mira' } },
      },
    };

    renderCabinet('/profile');

    expect(await screen.findByRole('heading', { name: 'Профиль' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Выйти' })).not.toBeInTheDocument();
  });
});
