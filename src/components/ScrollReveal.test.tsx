import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ScrollReveal } from './ScrollReveal';

let revealCallback: IntersectionObserverCallback | undefined;

class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    revealCallback = callback;
  }

  observe = vi.fn();
  disconnect = vi.fn();
}

afterEach(() => {
  revealCallback = undefined;
  vi.unstubAllGlobals();
});

function renderReveal(children: ReactNode = 'Content') {
  return render(
    <ScrollReveal as="section" data-testid="reveal-target">
      {children}
    </ScrollReveal>,
  );
}

describe('ScrollReveal', () => {
  it('keeps content visible when IntersectionObserver is unavailable', () => {
    renderReveal();

    expect(screen.getByTestId('reveal-target')).toHaveAttribute('data-reveal-state', 'visible');
    expect(screen.getByTestId('reveal-target')).toHaveClass('is-visible');
  });

  it('reveals content once it enters the viewport and disconnects the observer', () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    renderReveal();
    const target = screen.getByTestId('reveal-target');

    expect(target).toHaveAttribute('data-reveal-state', 'pending');
    expect(target).not.toHaveClass('is-visible');

    act(() => {
      revealCallback?.([
        { isIntersecting: true, target } as unknown as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
    });

    expect(target).toHaveAttribute('data-reveal-state', 'visible');
    expect(target).toHaveClass('is-visible');
  });
});
