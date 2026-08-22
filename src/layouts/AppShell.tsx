import { useLayoutEffect, useRef, useState, type JSX } from 'react';
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router';
import { RouteTransition } from '../app/RouteTransition';
import { useApp } from '../app/AppProvider';
import { BottomNavigation, type BottomNavigationItem } from '../components/BottomNavigation';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { Avatar } from '../components/Avatar';
import { Icon, type IconName } from '../components/Icon';
import { LanguageMenu } from '../components/LanguageMenu';
import { NotificationPopover } from '../components/NotificationPopover';
import { Onboarding } from '../components/Onboarding';
import { ProfileMenu } from '../components/ProfileMenu';
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
  const { pathname } = useLocation();
  const active = pathname === path || (path === '/subscriptions' && pathname === '/purchase');
  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={active ? 'shell-nav__link active' : 'shell-nav__link'}
      onClick={onNavigate}
      to={path}
    >
      <Icon name={icon} />
      <span>{t(titleKey)}</span>
    </Link>
  );
}

export function AppShell(): JSX.Element {
  const {
    logout,
    completeOnboarding,
    markAllNotificationsRead,
    markNotificationRead,
    setReturnPath,
    setTheme,
    state,
    telegramMiniApp,
  } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const notificationOpenerRef = useRef<HTMLButtonElement>(null);
  const notificationsWereOpenRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const unreadCount = state.notifications.filter(
    ({ read, type }) => !read && (type === 'ticket-created' || type === 'ticket-replied'),
  ).length;
  const nextTheme = state.preferences.theme === 'dark' ? 'light' : 'dark';
  const themeLabelKey: MessageKey = nextTheme === 'light'
    ? 'shell.theme.switchToLight'
    : 'shell.theme.switchToDark';
  const notificationsModal = notificationsOpen
    && notificationOpenerRef.current?.dataset.notificationOpener === 'drawer';
  const onboardingOpen = !state.preferences.onboardingCompleted;
  const backgroundInert = notificationsModal || onboardingOpen;

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
        aria-hidden={backgroundInert ? 'true' : undefined}
        className="app-header"
        data-testid="app-shell-header"
        inert={backgroundInert}
      >
        <div className="app-header__inner">
          <Brand compact />
          <nav aria-label={t('landing.header.navigation')} className="shell-nav shell-nav--desktop" data-onboarding-target="navigation">
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
                data-onboarding-target="notifications"
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
            <LanguageMenu />
            <ProfileMenu onSignOut={telegramMiniApp ? undefined : () => void signOut()} />
          </div>
          <Button
            ref={menuTriggerRef}
            aria-expanded={drawerOpen}
            aria-label={t('shell.drawer.open')}
            className="app-header__menu"
            data-onboarding-target="mobile-menu"
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

      <main
        aria-hidden={backgroundInert ? 'true' : undefined}
        className="route-viewport"
        id="main-content"
        inert={backgroundInert}
      >
        <RouteTransition>{outlet}</RouteTransition>
      </main>

      <Onboarding
        onComplete={completeOnboarding}
        onReady={setOnboardingReady}
        open={!state.preferences.onboardingCompleted}
      />

      <BottomNavigation inert={backgroundInert} items={BOTTOM_NAV_ITEMS} />

      <Drawer
        active={!notificationsOpen}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        returnFocusRef={menuTriggerRef}
      >
        {/* Разделы кабинета есть в нижней панели, поэтому в меню остаются
            только то, чего там нет: профиль, информация и настройки. */}
        <Link
          className="drawer-account"
          data-tariff={state.subscription?.tariffId}
          onClick={() => setDrawerOpen(false)}
          to="/profile"
        >
          <Avatar avatar={state.profile.avatar} name={state.profile.name} tariffId={state.subscription?.tariffId} />
          <span>
            <strong>{state.profile.name}</strong>
            <small>{state.profile.username}</small>
          </span>
          <Icon aria-hidden="true" className="drawer-account__chevron" name="chevron-right" size={18} />
        </Link>
        <div className="drawer__utilities">
          <Link
            className="button button--utility"
            onClick={() => setDrawerOpen(false)}
            to="/info"
          >
            <Icon name="info" />
            <span>{t('navigation.info')}</span>
          </Link>
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
          <LanguageMenu drawer />
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
