import { Navigate, Outlet, Route, Routes } from 'react-router';
import { AppShell } from '../layouts/AppShell';
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LandingPage } from '../pages/LandingPage';
import { PurchasePage } from '../pages/PurchasePage';
import { BalancePage } from '../pages/BalancePage';
import { ReferralPage } from '../pages/ReferralPage';
import { SupportPage } from '../pages/SupportPage';
import { InfoPage } from '../pages/InfoPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';
import type { MessageKey } from '../i18n/messages';
import { ProtectedRoute } from './ProtectedRoute';
import { useApp } from './AppProvider';

export const PROTECTED_ROUTES = [
  { path: '/dashboard', titleKey: 'navigation.dashboard' },
  { path: '/subscriptions', titleKey: 'navigation.subscriptions' },
  { path: '/purchase', titleKey: 'navigation.purchase' },
  { path: '/balance', titleKey: 'navigation.balance' },
  { path: '/referral', titleKey: 'navigation.referrals' },
  { path: '/support', titleKey: 'navigation.support' },
  { path: '/info', titleKey: 'navigation.info' },
  { path: '/profile', titleKey: 'navigation.profile' },
] as const satisfies ReadonlyArray<Readonly<{ path: string; titleKey: MessageKey }>>;

/**
 * Legal information is reachable from the public landing footer. Keep the
 * cabinet shell for an active session, while allowing signed-out visitors to
 * read the same document without being redirected to authentication.
 */
function InfoRouteLayout() {
  const { state } = useApp();
  return state.session.active ? <AppShell /> : <Outlet />;
}

/**
 * В Telegram Mini App человек приходит из бота в свой кабинет, витрина ему
 * не нужна. В обычном браузере корень по-прежнему отдаёт лендинг.
 */
function LandingRoute() {
  const { telegramMiniApp } = useApp();
  return telegramMiniApp ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function UnknownRoute() {
  const { state } = useApp();
  return <Navigate to={state.session.active ? '/dashboard' : '/'} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingRoute />} />
        <Route element={<InfoRouteLayout />}>
          <Route path="/info" element={<InfoPage />} />
        </Route>
      </Route>
      <Route path="auth" element={<AuthPage />} />
      <Route path="welcome" element={<Navigate to="/" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<UnknownRoute />} />
    </Routes>
  );
}
