import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate, useOutlet } from 'react-router';
import { RouteTransition } from './RouteTransition';

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

describe('RouteTransition', () => {
  it('resets viewport scroll when a route changes', () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollTo,
      writable: true,
    });
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('renders only the destination immediately after navigation', () => {
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));

    expect(screen.queryByTestId('dashboard-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('balance-screen')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/-screen$/)).toHaveLength(1);
    expect(screen.getByTestId('balance-screen').closest('[data-route-layer]'))
      .toHaveAttribute('data-route-layer', 'current');
  });

  it('renders the latest destination after rapid navigation without stale pages', () => {
    renderTransition();

    fireEvent.click(screen.getByRole('button', { name: 'balance' }));
    fireEvent.click(screen.getByRole('button', { name: 'subscriptions' }));

    expect(screen.queryByTestId('dashboard-screen')).not.toBeInTheDocument();
    expect(screen.queryByTestId('balance-screen')).not.toBeInTheDocument();
    expect(screen.getByTestId('subscriptions-screen')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/-screen$/)).toHaveLength(1);
  });
});
