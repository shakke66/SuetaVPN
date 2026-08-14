import type { CSSProperties, JSX } from 'react';
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
  items: readonly BottomNavigationItem[];
}

export function BottomNavigation({ items }: BottomNavigationProps): JSX.Element {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const normalizedPath = pathname === '/purchase' ? '/subscriptions' : pathname;
  const activeIndex = Math.max(items.findIndex(({ path }) => path === normalizedPath), 0);
  const style = { '--active-index': activeIndex } as CSSProperties;

  return (
    <nav
      aria-label={t('shell.bottomNav.label')}
      className="bottom-navigation"
      data-active-index={activeIndex}
      style={style}
    >
      {items.map(({ icon, path, titleKey }) => (
        <NavLink className="bottom-navigation__item" key={path} to={path}>
          <Icon name={icon} />
          <span>{t(titleKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
