import { useEffect, useRef, type CSSProperties, type JSX } from 'react';
import { NavLink, useLocation } from 'react-router';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import { Icon, type IconName } from './Icon';

export interface BottomNavigationItem {
  icon: IconName;
  path: string;
  titleKey: MessageKey;
}

interface BottomNavigationProps {
  inert?: boolean;
  items: readonly BottomNavigationItem[];
}

/** Чуть дольше самой анимации перехода: снять раньше — оборвать движение. */
const DIRECTION_HOLD_MS = 400;

export function BottomNavigation({ inert = false, items }: BottomNavigationProps): JSX.Element {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const normalizedPath = pathname === '/purchase' ? '/subscriptions' : pathname;
  const activeIndex = items.findIndex(({ path }) => path === normalizedPath);
  // На разделах вне панели, профиль и информация, индекс равен -1: подложка
  // гаснет на месте вместо переезда к первой вкладке и обратно.
  const lastIndexRef = useRef(0);
  const directionTimerRef = useRef(0);
  if (activeIndex >= 0) lastIndexRef.current = activeIndex;
  const style = { '--active-index': lastIndexRef.current } as CSSProperties;

  useEffect(() => () => window.clearTimeout(directionTimerRef.current), []);

  /**
   * Направление перехода ставим до навигации: кросс-фейд читается как смена
   * фотографий, а движение в сторону нажатой вкладки — как переход по разделам.
   * Снимаем после анимации: иначе следующий переход по ссылке внутри страницы
   * унаследует сторону от прошлого нажатия и уедет не туда.
   */
  const markDirection = (targetIndex: number) => () => {
    const root = document.documentElement;
    window.clearTimeout(directionTimerRef.current);
    if (activeIndex === -1 || targetIndex === activeIndex) {
      delete root.dataset.navDirection;
      return;
    }
    root.dataset.navDirection = targetIndex > activeIndex ? 'forward' : 'back';
    directionTimerRef.current = window.setTimeout(() => {
      delete root.dataset.navDirection;
    }, DIRECTION_HOLD_MS);
  };

  return (
    <nav
      aria-hidden={inert ? 'true' : undefined}
      aria-label={t('shell.bottomNav.label')}
      className="bottom-navigation"
      data-active-index={activeIndex}
      data-onboarding-target="mobile-navigation"
      inert={inert}
      style={style}
    >
      {items.map(({ icon, path, titleKey }, index) => (
        <NavLink
          className="bottom-navigation__item"
          key={path}
          onClick={markDirection(index)}
          to={path}
          viewTransition
        >
          <Icon name={icon} />
          <span>{t(titleKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
