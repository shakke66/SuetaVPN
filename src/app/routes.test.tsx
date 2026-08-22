import { render, screen } from '@testing-library/react';
import { App } from './App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';

function renderAt(path: string, active: boolean) {
  const state = createInitialState();
  state.session.active = active;
  state.preferences.onboardingCompleted = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = path;
  return render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

it('keeps legal information public for signed-out visitors', async () => {
  renderAt('/info', false);

  expect(await screen.findByRole('heading', { level: 1, name: 'Информация' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Вход в SuetaVPN' })).not.toBeInTheDocument();
});

it('keeps the protected shell around legal information for active sessions', async () => {
  renderAt('/info', true);

  expect(await screen.findByTestId('app-shell-header')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1, name: 'Информация' })).toBeInTheDocument();
});
