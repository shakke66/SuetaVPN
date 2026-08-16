import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

const NOW = '2026-08-16T10:00:00.000Z';

function storedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted state');
  return JSON.parse(raw) as AppStateV2;
}

function openSupport(update: (state: AppStateV2) => void = () => undefined) {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  update(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/support';
  return render(<App adapters={createLocalAdapters({
    delayMs: 0,
    now: () => NOW,
    idSource: (prefix) => `${prefix}-support-test`,
  })} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('support page', () => {
  it('validates, saves and opens a newly created ticket from its unread notification', async () => {
    const user = userEvent.setup();
    openSupport((state) => {
      state.tickets = [];
      state.notifications = [];
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Поддержка' })).toBeInTheDocument();
    expect(screen.getByText('Обращений пока нет')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Новое обращение' }));
    const dialog = screen.getByRole('dialog', { name: 'Новое обращение' });
    await user.click(within(dialog).getByRole('button', { name: 'Создать обращение' }));
    expect(within(dialog).getByText('Укажите тему')).toBeInTheDocument();
    expect(within(dialog).getByText('Введите сообщение')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Тема'), 'Не подключается TV');
    await user.type(within(dialog).getByLabelText('Сообщение'), 'Нужна помощь с Apple TV.');
    const attachment = new File(['screen'], 'apple-tv.png', { type: 'image/png' });
    await user.upload(within(dialog).getByLabelText('Прикрепить файл'), attachment);
    await user.click(within(dialog).getByRole('button', { name: 'Создать обращение' }));

    expect(await screen.findByRole('heading', { name: 'Не подключается TV' })).toBeInTheDocument();
    expect(screen.getByText('Нужна помощь с Apple TV.')).toBeInTheDocument();
    expect(screen.getByText('Вложение: apple-tv.png')).toBeInTheDocument();
    await waitFor(() => {
      expect(storedState().tickets[0]).toMatchObject({ subject: 'Не подключается TV', status: 'open', attachmentName: 'apple-tv.png' });
      expect(storedState().notifications[0]).toMatchObject({ type: 'ticket-created', read: false });
    });

    await user.click(screen.getByRole('button', { name: 'Открыть уведомления' }));
    const notifications = screen.getByRole('dialog', { name: 'Уведомления о тикетах' });
    await user.click(within(notifications).getByRole('link', { name: /Не подключается TV/ }));

    expect(await screen.findByRole('heading', { name: 'Не подключается TV' })).toBeInTheDocument();
    await waitFor(() => expect(storedState().notifications[0]?.read).toBe(true));
  });

  it('keeps the selected dialogue and validates a local user reply inline', async () => {
    const user = userEvent.setup();
    openSupport();

    await user.click(await screen.findByRole('button', { name: 'Как подключить устройство?' }));
    const reply = screen.getByLabelText('Ответ');
    await user.click(screen.getByRole('button', { name: 'Отправить ответ' }));
    expect(screen.getByText('Введите сообщение')).toBeInTheDocument();

    await user.type(reply, 'Проверил инструкцию, но нужен другой способ.');
    await user.click(screen.getByRole('button', { name: 'Отправить ответ' }));
    expect(await screen.findByText('Проверил инструкцию, но нужен другой способ.')).toBeInTheDocument();
    await waitFor(() => {
      const ticket = storedState().tickets.find(({ id }) => id === 'ticket-current');
      expect(ticket?.messages.at(-1)).toMatchObject({ author: 'user', text: 'Проверил инструкцию, но нужен другой способ.' });
      expect(ticket?.status).toBe('open');
    });
  });
});
