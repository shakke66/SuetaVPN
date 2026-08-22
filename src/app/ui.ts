import { useEffect, useState, type KeyboardEvent } from 'react';
import type { Period } from '../domain/types';

const MOBILE_QUERY = '(max-width: 767px)';

/** Телефонная раскладка страниц: мастер покупки, вкладки баланса. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

/** Стрелки, Home и End внутри role="radiogroup": выбирают соседний вариант и переводят на него фокус. */
export function moveRadioSelection<T>(
  event: KeyboardEvent<HTMLButtonElement>,
  values: readonly T[],
  currentIndex: number,
  select: (value: T) => void,
): void {
  let nextIndex: number | null = null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % values.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + values.length) % values.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = values.length - 1;
  }
  if (nextIndex === null) return;

  event.preventDefault();
  select(values[nextIndex]);
  event.currentTarget
    .closest('[role="radiogroup"]')
    ?.querySelectorAll<HTMLElement>('[role="radio"]')
    .item(nextIndex)
    .focus();
}

/** Ключ перевода для периода подписки: 1 → 'one', 12 → 'twelve'. */
export function periodKey(period: Period): 'one' | 'three' | 'six' | 'twelve' {
  if (period === 1) return 'one';
  if (period === 3) return 'three';
  if (period === 6) return 'six';
  return 'twelve';
}
