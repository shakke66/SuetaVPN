import { render, screen } from '@testing-library/react';
import { App } from '../app/App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

it('shows only production profile details without local-demo controls', async () => {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  state.profile.email = 'alexey@example.test';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/profile';

  render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);

  expect(await screen.findByRole('heading', { level: 1, name: 'Профиль' })).toBeInTheDocument();
  expect(screen.getByText('Алексей')).toBeInTheDocument();
  expect(screen.getByText('@sueta')).toBeInTheDocument();
  expect(screen.getByText('alexey@example.test')).toBeInTheDocument();
  expect(screen.getByText('Дата регистрации')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'SuetaVPN' })).toBeInTheDocument();
  expect(screen.queryByText(/Тема|Сбросить|Знакомство|Войти|Выйти/)).not.toBeInTheDocument();
});
