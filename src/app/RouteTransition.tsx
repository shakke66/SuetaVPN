import { useEffect, useRef, type JSX, type ReactNode } from 'react';
import { useLocation } from 'react-router';

/**
 * Kept as a public export for consumers that used the old transition budget.
 * Only the destination page is ever mounted: a tap never shows a stale
 * outgoing page or a collapsing intermediate height. The arriving page
 * animates in by itself, so the switch reads as movement instead of a cut.
 */
export const ROUTE_TRANSITION_MS = 0;

export type RouteDirection = 'forward' | 'back' | 'neutral';

interface RouteTransitionProps {
  children: ReactNode;
  /**
   * Порядок вкладок нижней навигации. По нему считается, с какой стороны
   * приходит новая страница. Без него переход остаётся нейтральным.
   */
  order?: readonly string[];
}

function resolveDirection(
  order: readonly string[],
  from: string,
  to: string,
): RouteDirection {
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return 'neutral';
  return toIndex > fromIndex ? 'forward' : 'back';
}

export function RouteTransition({ children, order = [] }: RouteTransitionProps): JSX.Element {
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);
  const directionRef = useRef<RouteDirection>('neutral');

  // Направление нужно уже в том кадре, где монтируется новый слой, иначе
  // анимация стартует раньше, чем атрибут доедет. Ref, а не состояние:
  // лишний рендер здесь дал бы второй запуск анимации.
  if (previousPathRef.current !== pathname) {
    directionRef.current = resolveDirection(order, previousPathRef.current, pathname);
    previousPathRef.current = pathname;
  }

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="route-transition">
      <div
        key={pathname}
        className="route-layer route-layer--current"
        data-direction={directionRef.current}
        data-route-layer="current"
      >
        {children}
      </div>
    </div>
  );
}
