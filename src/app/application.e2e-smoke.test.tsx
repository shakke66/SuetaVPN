import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import type { AppStateV2 } from '../domain/types';
import { App } from './App';

const VERIFICATION_CODE = '482731';
const NOW = '2026-08-16T10:00:00.000Z';

function persistedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted application state');
  return JSON.parse(raw) as AppStateV2;
}

function renderApplication() {
  return render(
    <App adapters={createLocalAdapters({
      delayMs: 0,
      idSource: (prefix) => `${prefix}-application-smoke`,
      now: () => NOW,
      verificationCodeSource: () => VERIFICATION_CODE,
    })} />,
  );
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

it('keeps the protected shell through the core journey and rehydrates persisted state', async () => {
  const user = userEvent.setup();
  const firstView = renderApplication();

  await user.click(within(await screen.findByRole('banner')).getByRole('link', { name: 'Подключиться' }));
  await user.type(await screen.findByRole('textbox', { name: 'Электронная почта' }), 'mira@example.com');
  await user.click(screen.getByRole('button', { name: 'Получить код' }));
  await user.type(await screen.findByRole('textbox', { name: 'Код подтверждения' }), VERIFICATION_CODE);
  await user.click(screen.getByRole('button', { name: 'Подтвердить код' }));

  expect(await screen.findByRole('heading', { name: 'Главная' })).toBeInTheDocument();
  const shellHeader = screen.getByTestId('app-shell-header');

  await user.click(within(shellHeader).getByRole('link', { name: 'Баланс' }));
  expect(await screen.findByRole('heading', { name: 'Баланс' })).toBeInTheDocument();
  expect(screen.getByTestId('app-shell-header')).toBe(shellHeader);
  await user.click(screen.getByRole('button', { name: /Пополнить на 100\s₽/ }));
  expect(await screen.findByRole('status')).toHaveTextContent(/Баланс пополнен на 100\s₽/);

  await user.click(within(shellHeader).getByRole('link', { name: 'Подписки' }));
  await user.click(await screen.findByRole('link', { name: 'Продлить' }));
  expect(await screen.findByRole('heading', { name: 'Оформление подписки' })).toBeInTheDocument();
  expect(screen.getByTestId('app-shell-header')).toBe(shellHeader);
  await user.click(screen.getByRole('button', { name: 'Оформить подписку' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Подписка успешно оформлена');

  await user.click(within(shellHeader).getByRole('link', { name: 'Поддержка' }));
  await user.click(await screen.findByRole('button', { name: 'Новое обращение' }));
  await user.type(screen.getByRole('textbox', { name: 'Тема' }), 'Проверка smoke flow');
  await user.type(screen.getByRole('textbox', { name: 'Сообщение' }), 'Пожалуйста, проверьте полный маршрут.');
  await user.click(screen.getByRole('button', { name: 'Создать обращение' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Обращение создано');

  await user.click(screen.getByRole('button', { name: 'Открыть уведомления' }));
  expect(await screen.findByRole('dialog', { name: 'Уведомления о тикетах' })).toHaveTextContent(
    'Обращение «Проверка smoke flow» создано',
  );

  const beforeRemount = persistedState();
  expect(beforeRemount.session.active).toBe(true);
  expect(beforeRemount.tickets[0]?.subject).toBe('Проверка smoke flow');
  expect(beforeRemount.wallet.balance).toBe(640);
  firstView.unmount();
  renderApplication();

  expect(await screen.findByRole('heading', { name: 'Поддержка' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Проверка smoke flow' })).toHaveAttribute('aria-pressed', 'true');
  expect(persistedState().wallet.balance).toBe(640);

  await user.click(screen.getByRole('button', { name: 'Выйти' }));
  expect(await screen.findByRole('heading', { name: 'Интернет на вашей стороне' })).toBeInTheDocument();
  await waitFor(() => expect(persistedState().session.active).toBe(false));
}, 15_000);
