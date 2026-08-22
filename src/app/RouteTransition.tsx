import { useEffect, useRef, type JSX, type ReactNode } from 'react';
import { useLocation } from 'react-router';

/**
 * Kept as a public export for consumers that used the old transition budget.
 * Route changes are intentionally synchronous now: the shell stays mounted
 * and only the destination page is rendered, so a tap never shows a stale
 * outgoing page or a collapsing intermediate height.
 */
export const ROUTE_TRANSITION_MS = 0;

interface RouteTransitionProps {
  children: ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps): JSX.Element {
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="route-transition">
      <div
        key={pathname}
        className="route-layer route-layer--current"
        data-direction="neutral"
        data-route-layer="current"
      >
        {children}
      </div>
    </div>
  );
}
