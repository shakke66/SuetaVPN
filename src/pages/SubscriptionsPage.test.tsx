import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function openSubscriptions(update: (state: AppStateV2) => void = () => undefined) {
  const state = createInitialState();
  state.session.active = true;
  state.preferences.onboardingCompleted = true;
  update(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.location.hash = '#/subscriptions';
  return render(<App adapters={createLocalAdapters({ delayMs: 0 })} />);
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('subscriptions screen', () => {
  it('lists connected devices with the plan limit', async () => {
    openSubscriptions();

    const devices = within(await screen.findByRole('region', { name: 'Устройства' }));
    expect(devices.getByText('2/4 подключено')).toBeInTheDocument();
    expect(devices.getByText('Ноутбук')).toBeInTheDocument();
    expect(devices.getByText('в сети сейчас')).toBeInTheDocument();
    expect(devices.getByText('Телефон')).toBeInTheDocument();
    expect(devices.getByRole('link', { name: 'Подключить устройство' })).toBeInTheDocument();
  });

  it('shows only subscription purchases in the history, newest first', async () => {
    openSubscriptions();

    const history = within(await screen.findByRole('region', { name: 'История подписок' }));
    const rows = history.getAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('БАЗА · 1 месяц');
    expect(rows[0]).toHaveTextContent(/250\s₽/);
    expect(history.queryByText(/Пополнение/)).not.toBeInTheDocument();
  });

  it('toggles auto-renewal, explains the next charge and persists the choice', async () => {
    const user = userEvent.setup();
    openSubscriptions();

    const renewal = within(await screen.findByRole('region', { name: 'Автопродление' }));
    const toggle = renewal.getByRole('switch', { name: 'Автопродление' });
    expect(toggle).toBeChecked();
    expect(renewal.getByText(/Следующий платёж/)).toHaveTextContent(/250\s₽/);

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(renewal.getByText(/Автопродление выключено/)).toBeInTheDocument();
    await waitFor(() => expect(storedState().subscription?.autoRenew).toBe(false));
  });

  it('falls back to the empty card when there is no subscription', async () => {
    openSubscriptions((state) => { state.subscription = null; });

    expect(within(await screen.findByRole('main')).getByText('Подписка ещё не оформлена')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Выбрать подписку' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Автопродление' })).not.toBeInTheDocument();
  });
});

describe('шапка подписки на телефоне', () => {
  const realMatchMedia = window.matchMedia;

  function useMobileLayout() {
    window.matchMedia = ((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  function term(container: HTMLElement): HTMLElement {
    const node = container.querySelector('.subscriptions-mobile__term');
    if (!node) throw new Error('expected the term block on the phone layout');
    return node as HTMLElement;
  }

  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it('не показывает ни бейдж статуса, ни дату окончания — состояние держит полоса', async () => {
    useMobileLayout();

    const { container } = openSubscriptions();
    await screen.findByRole('tablist', { name: 'Разделы подписки' });

    expect(term(container)).not.toHaveTextContent('Активна');
    expect(term(container)).not.toHaveTextContent('Действует до');
  });

  it('на девяти днях зовёт продлить и красит полосу в предупреждающее состояние', async () => {
    useMobileLayout();

    const { container } = openSubscriptions((state) => {
      if (state.subscription) state.subscription.daysLeft = 9;
    });
    await screen.findByRole('tablist', { name: 'Разделы подписки' });

    expect(term(container)).toHaveTextContent('пора продлить');
    expect(term(container).dataset.state).toBe('warn');
  });

  it('на нуле не рисует заливку полосы — пустая дорожка и есть сообщение', async () => {
    useMobileLayout();

    const { container } = openSubscriptions((state) => {
      if (state.subscription) {
        state.subscription.status = 'expired';
        state.subscription.daysLeft = 0;
      }
    });
    await screen.findByRole('tablist', { name: 'Разделы подписки' });

    expect(term(container).querySelector('.subscription-card__bar')).toBeNull();
  });

  it('на истёкшей подписке меняет бейдж тарифа на «Неактивно»', async () => {
    useMobileLayout();

    const { container } = openSubscriptions((state) => {
      if (state.subscription) {
        state.subscription.status = 'expired';
        state.subscription.daysLeft = 0;
      }
    });
    await screen.findByRole('tablist', { name: 'Разделы подписки' });

    expect(term(container)).toHaveTextContent('Неактивно');
    expect(term(container)).not.toHaveTextContent('БАЗА');
    expect(term(container).dataset.state).toBe('off');
  });
});
