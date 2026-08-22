import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { App } from '../app/App';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { STORAGE_KEY } from '../domain/migrations';
import { createInitialState } from '../domain/state';
import type { AppStateV2 } from '../domain/types';

let canMeasure = false;
let resizeCallback: ResizeObserverCallback | undefined;

class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  observe() {}

  disconnect() {}
}

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { bottom: top + height, height, left, right: left + width, toJSON: () => ({}), top, width, x: left, y: top };
}

function storedState(): AppStateV2 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('expected persisted state');
  return JSON.parse(raw) as AppStateV2;
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
  canMeasure = false;
  resizeCallback = undefined;
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
    const element = this;
    if (element.matches('[data-onboarding-target]') || element.id === 'main-content') {
      return canMeasure ? rect(28, 48, 280, 44) : rect(0, 0, 0, 0);
    }
    if (element.classList.contains('onboarding__tooltip')) return rect(0, 0, 240, 120);
    return rect(0, 0, 0, 0);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('isolates the shell while onboarding geometry is not yet measurable', async () => {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/dashboard';

  render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);

  expect(await screen.findByTestId('onboarding-overlay')).toHaveAttribute('data-ready', 'false');
  for (const region of [
    screen.getByTestId('app-shell-header'),
    document.getElementById('main-content'),
    document.querySelector('.bottom-navigation'),
  ]) {
    expect(region).toHaveAttribute('aria-hidden', 'true');
    expect(region).toHaveAttribute('inert');
  }
});

it('keeps one hidden portal overlay until geometry exists and persists completion without a 0,0 flash', async () => {
  const user = userEvent.setup();
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/dashboard';

  render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);

  const overlay = await screen.findByTestId('onboarding-overlay');
  const tooltip = within(overlay).getByRole('dialog', { hidden: true });
  const header = screen.getByTestId('app-shell-header');
  const main = document.getElementById('main-content');
  const bottomNavigation = document.querySelector('.bottom-navigation');
  expect(overlay).toHaveAttribute('data-ready', 'false');
  expect(tooltip).toHaveStyle({ left: '-9999px', top: '-9999px', visibility: 'hidden' });

  canMeasure = true;
  act(() => resizeCallback?.([], {} as ResizeObserver));
  await waitFor(() => expect(overlay).toHaveAttribute('data-ready', 'true'));
  expect(header).toHaveAttribute('aria-hidden', 'true');
  expect(header).toHaveAttribute('inert');
  expect(main).toHaveAttribute('aria-hidden', 'true');
  expect(main).toHaveAttribute('inert');
  expect(bottomNavigation).toHaveAttribute('aria-hidden', 'true');
  expect(bottomNavigation).toHaveAttribute('inert');
  expect(tooltip).not.toHaveStyle({ left: '0px' });
  expect(tooltip).not.toHaveStyle({ top: '0px' });

  await user.click(within(overlay).getByRole('button', { name: 'Далее' }));
  expect(await screen.findByText('Подписка')).toBeInTheDocument();
  expect(screen.getByTestId('onboarding-overlay')).toBe(overlay);

  await user.click(within(overlay).getByRole('button', { name: 'Пропустить' }));
  await waitFor(() => expect(storedState().preferences.onboardingCompleted).toBe(true));
  expect(screen.queryByTestId('onboarding-overlay')).not.toBeInTheDocument();
  expect(header).not.toHaveAttribute('aria-hidden');
  expect(header).not.toHaveAttribute('inert');
  expect(main).not.toHaveAttribute('aria-hidden');
  expect(main).not.toHaveAttribute('inert');
  expect(bottomNavigation).not.toHaveAttribute('aria-hidden');
  expect(bottomNavigation).not.toHaveAttribute('inert');
  expect(screen.getByRole('link', { name: 'Управлять подпиской' })).toHaveFocus();
});

it('traps Tab and Shift+Tab within onboarding controls', async () => {
  const user = userEvent.setup();
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/dashboard';
  canMeasure = true;

  render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);

  const overlay = await screen.findByTestId('onboarding-overlay');
  const next = within(overlay).getByRole('button', { name: 'Далее' });
  const skip = within(overlay).getByRole('button', { name: 'Пропустить' });
  await waitFor(() => expect(next).toHaveFocus());

  await user.tab();
  expect(skip).toHaveFocus();
  await user.tab({ shift: true });
  expect(next).toHaveFocus();
});

it('keeps the tour hidden when every responsive target is unavailable', async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
    if (this.matches('[data-onboarding-target]')) return rect(0, 0, 0, 0);
    if (this.id === 'main-content') return rect(12, 72, 336, 240);
    if (this.classList.contains('onboarding__tooltip')) return rect(0, 0, 280, 180);
    return rect(0, 0, 0, 0);
  });
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/dashboard';

  render(<StrictMode><App adapters={createLocalAdapters({ delayMs: 0 })} /></StrictMode>);

  const overlay = await screen.findByTestId('onboarding-overlay');
  await waitFor(() => expect(overlay).toHaveAttribute('data-ready', 'false'));
  expect(within(overlay).getByRole('dialog', { hidden: true })).not.toBeVisible();
});
