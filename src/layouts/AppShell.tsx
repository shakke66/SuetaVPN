import { useLayoutEffect, useRef, useState, type JSX } from 'react';
import { NavLink, useNavigate, useOutlet } from 'react-router';
import { RouteTransition } from '../app/RouteTransition';
import { useApp } from '../app/AppProvider';
import { BottomNavigation, type BottomNavigationItem } from '../components/BottomNavigation';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { Icon, type IconName } from '../components/Icon';
import { NotificationPopover } from '../components/NotificationPopover';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';

interface NavigationItem extends BottomNavigationItem {
  bottom: boolean;
}

export const NAV_ITEMS = [
  { path: '/dashboard', titleKey: 'navigation.dashboard', icon: 'dashboard', bottom: true },
  { path: '/subscriptions', titleKey: 'navigation.subscriptions', icon: 'subscriptions', bottom: true },
  { path: '/balance', titleKey: 'navigation.balance', icon: 'balance', bottom: true },
  { path: '/referral', titleKey: 'navigation.referrals', icon: 'referral', bottom: true },
  { path: '/support', titleKey: 'navigation.support', icon: 'support', bottom: true },
  { path: '/info', titleKey: 'navigation.info', icon: 'info', bottom: false },
] as const satisfies readonly NavigationItem[];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(({ bottom }) => bottom);

function ShellNavLink({
  icon,
  onNavigate,
  path,
  titleKey,
}: {
  icon: IconName;
  onNavigate?: () => void;
  path: string;
  titleKey: MessageKey;
}): JSX.Element {
  const { t } = useI18n();
  return (
    <NavLink className="shell-nav__link" onClick={onNavigate} to={path}>
      <Icon name={icon} />
      <span>{t(titleKey)}</span>
    </NavLink>
  );
}

export function AppShell(): JSX.Element {
  const {
    logout,
    markAllNotificationsRead,
    markNotificationRead,
    setReturnPath,
    setTheme,
    state,
    telegramMiniApp,
  } = useApp();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationOpenerRef = useRef<HTMLButtonElement>(null);
  const notificationsWereOpenRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = state.notifications.filter(
    ({ read, type }) => !read && (type === 'ticket-created' || type === 'ticket-replied'),
  ).length;
  const nextTheme = state.preferences.theme === 'dark' ? 'light' : 'dark';
  const themeLabelKey: MessageKey = nextTheme === 'light'
    ? 'shell.theme.switchToLight'
    : 'shell.theme.switchToDark';
  const nextLocale = locale === 'ru' ? 'en' : 'ru';
  const localeLabelKey: MessageKey = nextLocale === 'ru'
    ? 'shell.language.switchToRussian'
    : 'shell.language.switchToEnglish';
  const notificationsModal = notificationsOpen
    && notificationOpenerRef.current?.dataset.notificationOpener === 'drawer';

  useLayoutEffect(() => {
    if (notificationsOpen) {
      notificationsWereOpenRef.current = true;
      return;
    }
    if (!notificationsWereOpenRef.current) return;
    notificationsWereOpenRef.current = false;
    notificationOpenerRef.current?.focus();
  }, [notificationsOpen]);

  const signOut = async () => {
    setReturnPath(null);
    navigate('/', { replace: true });
    await logout();
  };

  return (
    <div className="app-shell">
      <header
        aria-hidden={notificationsModal ? 'true' : undefined}
        className="app-header"
        data-testid="app-shell-header"
        inert={notificationsModal}
      >
        <div className="app-header__inner">
          <Brand compact />
          <nav aria-label={t('landing.header.navigation')} className="shell-nav shell-nav--desktop">
            {NAV_ITEMS.map((item) => <ShellNavLink key={item.path} {...item} />)}
          </nav>
          <div className="app-header__utilities shell-desktop-only">
            <Button
              aria-label={t(themeLabelKey)}
              iconOnly
              onClick={() => void setTheme(nextTheme)}
              variant="utility"
            >
              <Icon name={nextTheme === 'light' ? 'sun' : 'moon'} />
            </Button>
            <div className="notification-anchor">
              <Button
                aria-expanded={notificationsOpen}
                aria-label={t('shell.notifications.open')}
                data-notification-opener="desktop"
                iconOnly
                onClick={(event) => {
                  notificationOpenerRef.current = event.currentTarget;
                  setNotificationsOpen((current) => !current);
                }}
                variant="utility"
              >
                <Icon name="bell" />
                {unreadCount > 0 ? (
                  <span
                    aria-label={t('shell.notifications.unreadCount', { amount: unreadCount })}
                    className="notification-badge"
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </Button>
            </div>
            <Button
              aria-label={t(localeLabelKey)}
              className="locale-control"
              onClick={() => setLocale(nextLocale)}
              variant="utility"
            >
              <Icon name="globe" />
              <span>{locale.toUpperCase()}</span>
            </Button>
            <NavLink aria-label={t('navigation.profile')} className="profile-control" to="/profile">
              <Icon name="profile" />
              <span>{state.profile.name}</span>
            </NavLink>
            {!telegramMiniApp ? (
              <Button onClick={() => void signOut()} variant="danger">
                <Icon name="logout" />
                <span>{t('auth.actions.logout')}</span>
              </Button>
            ) : null}
          </div>
          <Button
            ref={menuTriggerRef}
            aria-expanded={drawerOpen}
            aria-label={t('shell.drawer.open')}
            className="app-header__menu"
            iconOnly
            onClick={() => setDrawerOpen(true)}
            variant="utility"
          >
            <Icon name="menu" />
          </Button>
        </div>
      </header>

      <NotificationPopover
        notifications={state.notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={markAllNotificationsRead}
        onMarkRead={markNotificationRead}
        open={notificationsOpen}
        tickets={state.tickets}
        triggerRef={notificationOpenerRef}
      />

      {telegramMiniApp ? (
        <p
          aria-hidden={notificationsModal ? 'true' : undefined}
          className="mini-app-notice"
          inert={notificationsModal}
        >
          {t('auth.telegram.backendValidation')}
        </p>
      ) : null}

      <main
        aria-hidden={notificationsModal ? 'true' : undefined}
        className="route-viewport"
        id="main-content"
        inert={notificationsModal}
      >
        <RouteTransition>{outlet}</RouteTransition>
      </main>

      <BottomNavigation inert={notificationsModal} items={BOTTOM_NAV_ITEMS} />

      <Drawer
        active={!notificationsOpen}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        returnFocusRef={menuTriggerRef}
      >
        <div className="drawer-account">
          <span className="drawer-account__avatar" aria-hidden="true">
            {state.profile.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{state.profile.name}</strong>
            <small>{state.profile.username}</small>
          </span>
        </div>
        <nav aria-label={t('landing.header.navigation')} className="shell-nav shell-nav--drawer">
          {NAV_ITEMS.map((item) => (
            <ShellNavLink key={item.path} {...item} onNavigate={() => setDrawerOpen(false)} />
          ))}
          <ShellNavLink
            icon="profile"
            onNavigate={() => setDrawerOpen(false)}
            path="/profile"
            titleKey="navigation.profile"
          />
        </nav>
        <div className="drawer__utilities">
          <Button
            aria-expanded={notificationsOpen}
            data-notification-opener="drawer"
            onClick={(event) => {
              notificationOpenerRef.current = event.currentTarget;
              setNotificationsOpen(true);
            }}
            variant="utility"
          >
            <Icon name="bell" />
            <span>{t('shell.notifications.open')}</span>
          </Button>
          <Button onClick={() => void setTheme(nextTheme)} variant="utility">
            <Icon name={nextTheme === 'light' ? 'sun' : 'moon'} />
            <span>{t(themeLabelKey)}</span>
          </Button>
          <Button onClick={() => setLocale(nextLocale)} variant="utility">
            <Icon name="globe" />
            <span>{t(localeLabelKey)}</span>
          </Button>
          {!telegramMiniApp ? (
            <Button onClick={() => void signOut()} variant="danger">
              <Icon name="logout" />
              <span>{t('auth.actions.logout')}</span>
            </Button>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
