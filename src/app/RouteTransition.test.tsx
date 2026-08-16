import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate, useOutlet } from 'react-router';
import { RouteTransition } from './RouteTransition';

type ReducedMotionListener = (event: MediaQueryListEvent) => void;
let reducedMotionMatches = false;
let reducedMotionListeners = new Set<ReducedMotionListener>();

function installReducedMotion(matches: boolean) {
  reducedMotionMatches = matches;
  reducedMotionListeners = new Set();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      get matches() { return reducedMotionMatches; },
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
        if (type === 'change' && typeof listener === 'function') {
          reducedMotionListeners.add(listener as unknown as ReducedMotionListener);
        }
      },
      removeEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
        if (type === 'change' && typeof listener === 'function') {
          reducedMotionListeners.delete(listener as unknown as ReducedMotionListener);
        }
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

function setReducedMotion(matches: boolean) {
  reducedMotionMatches = matches;
  const event = { matches, media: '(prefers-reduced-motion: reduce)' } as MediaQueryListEvent;
  reducedMotionListeners.forEach((listener) => listener(event));
}

function TransitionHarness() {
  const navigate = useNavigate();
  const outlet = useOutlet();
  return (
    <>
      <button type="button" onClick={() => navigate('/dashboard')}>dashboard</button>
      <button type="button" onClick={() => navigate('/subscriptions')}>subscriptions</button>
      <button type="button" onClick={() => navigate('/balance')}>balance</button>
      <RouteTransition>{outlet}</RouteTransition>
    </>
  );
}

function renderTransition(initialEntry = '/dashboard'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<TransitionHarness />}>
          <Route path="dashboard" element={<h1 data-testid="dashboard-screen">Dashboard</h1>} />
          <Route path="subscriptions" element={<h1 data-testid="subscriptions-screen">Subscriptions</h1>} />
          <Route path="balance" element={<h1 data-testid="balance-screen">Balance</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function layerFor(node: HTMLElement): HTMLElement {
  const layer = node.closest<HTMLElement>('[data-route-layer]');
  if (!layer) throw new Error('expected a route layer');
  return layer;
}

beforeEach(() => {
  vi.useFakeTimers();
  installReducedMotion(false);
});

afterEach(() => {
  act(() => vi.runOnlyPendingTimers());
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('RouteTransition', () => {
  it('orders main tabs, overlaps both layers for 260 ms and retires outgoing content', () => {
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));

    const dashboardOutgoing = layerFor(screen.getByTestId('dashboard-screen'));
    const balanceIncoming = layerFor(screen.getByTestId('balance-screen'));
    expect(dashboardOutgoing).toHaveAttribute('data-route-layer', 'outgoing');
    expect(dashboardOutgoing).toHaveAttribute('aria-hidden', 'true');
    expect(dashboardOutgoing).toHaveAttribute('inert');
    expect(balanceIncoming).toHaveAttribute('data-direction', 'forward');
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(2);

    act(() => vi.advanceTimersByTime(259));
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(2);

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId('dashboard-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('balance-screen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'subscriptions' }));

    expect(layerFor(screen.getByTestId('subscriptions-screen'))).toHaveAttribute(
      'data-direction',
      'backward',
    );
    expect(screen.getByTestId('balance-screen')).toBeInTheDocument();
  });

  it('renders only the destination when reduced motion is requested', () => {
    installReducedMotion(true);
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));

    expect(screen.queryByTestId('dashboard-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('balance-screen')).toBeInTheDocument();
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(1);
  });

  it('retires an in-flight outgoing layer when reduced motion is enabled', () => {
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));
    expect(screen.getByTestId('dashboard-screen')).toBeInTheDocument();
    expect(screen.getByTestId('balance-screen')).toBeInTheDocument();

    act(() => setReducedMotion(true));

    expect(screen.queryByTestId('dashboard-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('balance-screen')).toBeInTheDocument();
  });

  it('preserves the destination HTMLElement when its incoming layer becomes current', () => {
    renderTransition();

    const source = screen.getByTestId('dashboard-screen');
    fireEvent.click(screen.getByRole('button', { name: 'balance' }));
    const destination = screen.getByTestId('balance-screen');
    expect(destination).not.toBe(source);

    act(() => vi.advanceTimersByTime(260));

    expect(screen.getByTestId('balance-screen')).toBe(destination);
    expect(layerFor(destination)).toHaveAttribute('data-route-layer', 'current');
  });

  it('retires only the latest outgoing layer after rapid navigation', () => {
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));
    const intermediateDestination = screen.getByTestId('balance-screen');
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(screen.getByRole('button', { name: 'subscriptions' }));

    const latestDestination = screen.getByTestId('subscriptions-screen');
    expect(latestDestination).not.toBe(intermediateDestination);
    expect(screen.queryByTestId('dashboard-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('balance-screen')).toBe(intermediateDestination);
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(2);

    act(() => vi.advanceTimersByTime(60));
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(2);

    act(() => vi.advanceTimersByTime(199));
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(2);

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId('balance-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('subscriptions-screen')).toBe(latestDestination);
    expect(screen.getAllByTestId(/-screen$/)).toHaveLength(1);
  });
});
