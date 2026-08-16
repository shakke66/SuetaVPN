import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';

function openInfo(hash = '#/info') {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = hash;
  return render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

it('keeps only FAQ, agreement and privacy tabs with equal smooth FAQ headers', async () => {
  const user = userEvent.setup();
  openInfo();

  expect(await screen.findByRole('heading', { level: 1, name: 'Информация' })).toBeInTheDocument();
  const tabList = screen.getByRole('tablist');
  expect(within(tabList).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Вопросы и ответы',
    'Пользовательское соглашение',
    'Политика конфиденциальности',
  ]);
  expect(screen.queryByText('Правила')).not.toBeInTheDocument();
  expect(screen.queryByText('Оферта')).not.toBeInTheDocument();
  expect(screen.queryByText('Статусы')).not.toBeInTheDocument();

  const connection = screen.getByRole('button', { name: 'Как подключиться?' });
  const renewal = screen.getByRole('button', { name: 'Как продлить подписку?' });
  expect(connection.closest('.accordion__header')?.className).toBe(renewal.closest('.accordion__header')?.className);
  await user.click(connection);
  await user.click(renewal);
  expect(screen.getByText('Оформите подписку и выберите устройство.')).toBeVisible();
  expect(screen.getByText('Откройте раздел подписок и выберите период.')).toBeVisible();

  await user.click(within(tabList).getByRole('tab', { name: 'Пользовательское соглашение' }));
  expect(screen.getByText('Текст соглашения будет опубликован здесь.')).toBeInTheDocument();
  await user.click(within(tabList).getByRole('tab', { name: 'Политика конфиденциальности' }));
  expect(screen.getByText('Текст политики будет опубликован здесь.')).toBeInTheDocument();
});

it.each([
  ['agreement', 'Пользовательское соглашение', 'Текст соглашения будет опубликован здесь.'],
  ['privacy', 'Политика конфиденциальности', 'Текст политики будет опубликован здесь.'],
] as const)('opens the requested %s document tab from the hash query', async (tab, label, content) => {
  openInfo(`#/info?tab=${tab}`);

  expect(await screen.findByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText(content)).toBeInTheDocument();
});

it('falls back to FAQ for an invalid tab query', async () => {
  openInfo('#/info?tab=unsupported');

  expect(await screen.findByRole('tab', { name: 'Вопросы и ответы' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { name: 'Вопросы и ответы' })).toBeInTheDocument();
});

it('keeps the hash query synchronized with user tab changes', async () => {
  const user = userEvent.setup();
  openInfo('#/info?tab=agreement');
  const privacy = await screen.findByRole('tab', { name: 'Политика конфиденциальности' });

  await user.click(privacy);

  await waitFor(() => expect(window.location.hash).toBe('#/info?tab=privacy'));
  expect(privacy).toHaveAttribute('aria-selected', 'true');
});
