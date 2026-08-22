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

it('keeps only the agreement and privacy documents and opens the agreement first', async () => {
  const user = userEvent.setup();
  openInfo();

  expect(await screen.findByRole('heading', { level: 1, name: 'Информация' })).toBeInTheDocument();
  const tabList = screen.getByRole('tablist');
  expect(within(tabList).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Пользовательское соглашение',
    'Политика конфиденциальности',
  ]);
  expect(screen.queryByRole('tab', { name: 'Вопросы и ответы' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /публичная оферта/i })).toBeInTheDocument();

  await user.click(within(tabList).getByRole('tab', { name: 'Политика конфиденциальности' }));
  expect(screen.getByRole('heading', { name: /Политика конфиденциальности SuetaVPN/ })).toBeInTheDocument();
});

it.each([
  ['agreement', 'Пользовательское соглашение', /публичная оферта/i],
  ['privacy', 'Политика конфиденциальности', /Политика конфиденциальности SuetaVPN/],
] as const)('opens the requested %s document tab from the hash query', async (tab, label, heading) => {
  openInfo(`#/info?tab=${tab}`);

  expect(await screen.findByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
});

it('falls back to the agreement for an invalid tab query', async () => {
  openInfo('#/info?tab=unsupported');

  expect(await screen.findByRole('tab', { name: 'Пользовательское соглашение' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { name: /публичная оферта/i })).toBeInTheDocument();
});

it('keeps the hash query synchronized with user tab changes', async () => {
  const user = userEvent.setup();
  openInfo('#/info?tab=agreement');
  const privacy = await screen.findByRole('tab', { name: 'Политика конфиденциальности' });

  await user.click(privacy);

  await waitFor(() => expect(window.location.hash).toBe('#/info?tab=privacy'));
  expect(privacy).toHaveAttribute('aria-selected', 'true');
});
