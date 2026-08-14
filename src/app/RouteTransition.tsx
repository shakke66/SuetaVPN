import { useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { useLocation } from 'react-router';

export const ROUTE_TRANSITION_MS = 260;

const MAIN_TAB_PATHS = [
  '/dashboard',
  '/subscriptions',
  '/balance',
  '/referral',
  '/support',
] as const;

type Direction = 'backward' | 'forward' | 'neutral';

interface RouteTransitionProps {
  children: ReactNode;
}

interface RouteSnapshot {
  node: ReactNode;
  pathname: string;
}

interface OutgoingSnapshot extends RouteSnapshot {
  direction: Direction;
}

function routeDirection(previousPath: string, nextPath: string): Direction {
  const previousIndex = MAIN_TAB_PATHS.indexOf(previousPath as (typeof MAIN_TAB_PATHS)[number]);
  const nextIndex = MAIN_TAB_PATHS.indexOf(nextPath as (typeof MAIN_TAB_PATHS)[number]);
  if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) return 'neutral';
  return nextIndex > previousIndex ? 'forward' : 'backward';
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

export function RouteTransition({ children }: RouteTransitionProps): JSX.Element {
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();
  const previousRef = useRef<RouteSnapshot>({ node: children, pathname });
  const [outgoing, setOutgoing] = useState<OutgoingSnapshot | null>(null);
  const [direction, setDirection] = useState<Direction>('neutral');

  useLayoutEffect(() => {
    const previous = previousRef.current;
    if (previous.pathname !== pathname) {
      const nextDirection = routeDirection(previous.pathname, pathname);
      setDirection(nextDirection);
      setOutgoing(reducedMotion ? null : { ...previous, direction: nextDirection });
    } else if (reducedMotion) {
      setOutgoing(null);
    }
    previousRef.current = { node: children, pathname };
  }, [children, pathname, reducedMotion]);

  useEffect(() => {
    if (!outgoing) return;
    const timeout = window.setTimeout(() => setOutgoing(null), ROUTE_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [outgoing]);

  return (
    <div className="route-transition">
      {outgoing ? (
        <div
          aria-hidden="true"
          className="route-layer route-layer--outgoing"
          data-direction={outgoing.direction}
          data-route-layer="outgoing"
          inert
        >
          {outgoing.node}
        </div>
      ) : null}
      <div
        className="route-layer route-layer--incoming"
        data-direction={direction}
        data-route-layer={outgoing ? 'incoming' : 'current'}
      >
        {children}
      </div>
    </div>
  );
}
