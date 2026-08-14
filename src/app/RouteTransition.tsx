import { useEffect, useLayoutEffect, useState, type JSX, type ReactNode } from 'react';
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
  key: string;
  node: ReactNode;
  pathname: string;
}

interface TransitionState {
  current: RouteSnapshot;
  direction: Direction;
  generation: number;
  outgoing: RouteSnapshot | null;
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
  const location = useLocation();
  const { pathname } = location;
  const reducedMotion = useReducedMotion();
  const snapshotKey = `${location.key}:${pathname}`;
  const [transition, setTransition] = useState<TransitionState>(() => ({
    current: { key: snapshotKey, node: children, pathname },
    direction: 'neutral',
    generation: 0,
    outgoing: null,
  }));

  useLayoutEffect(() => {
    setTransition((previous) => {
      if (previous.current.key === snapshotKey) {
        if (previous.current.node === children && (!reducedMotion || !previous.outgoing)) {
          return previous;
        }
        return {
          ...previous,
          current: { ...previous.current, node: children },
          outgoing: reducedMotion ? null : previous.outgoing,
        };
      }

      const direction = routeDirection(previous.current.pathname, pathname);
      return {
        current: { key: snapshotKey, node: children, pathname },
        direction,
        generation: previous.generation + 1,
        outgoing: reducedMotion ? null : previous.current,
      };
    });
  }, [children, pathname, reducedMotion, snapshotKey]);

  useEffect(() => {
    if (!transition.outgoing) return;
    const generation = transition.generation;
    const timeout = window.setTimeout(() => {
      setTransition((current) => (
        current.generation === generation ? { ...current, outgoing: null } : current
      ));
    }, ROUTE_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [transition.generation, transition.outgoing]);

  return (
    <div className="route-transition">
      {transition.outgoing ? (
        <div
          key={transition.outgoing.key}
          aria-hidden="true"
          className="route-layer route-layer--outgoing"
          data-direction={transition.direction}
          data-route-layer="outgoing"
          inert
        >
          {transition.outgoing.node}
        </div>
      ) : null}
      <div
        key={transition.current.key}
        className="route-layer route-layer--incoming"
        data-direction={transition.direction}
        data-route-layer={transition.outgoing ? 'incoming' : 'current'}
      >
        {transition.current.node}
      </div>
    </div>
  );
}
