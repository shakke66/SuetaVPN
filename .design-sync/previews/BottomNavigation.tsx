import { BottomNavigation } from 'suetavpn';

const ITEMS = [
  { path: '/dashboard', titleKey: 'navigation.dashboard', icon: 'dashboard' },
  { path: '/subscriptions', titleKey: 'navigation.subscriptions', icon: 'subscriptions' },
  { path: '/balance', titleKey: 'navigation.balance', icon: 'balance' },
  { path: '/referral', titleKey: 'navigation.referrals', icon: 'referral' },
  { path: '/support', titleKey: 'navigation.support', icon: 'support' },
] as const;

const phone: React.CSSProperties = {
  position: 'relative',
  height: 420,
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  overflow: 'hidden',
};

/** Нижняя панель мобильного кабинета: пять разделов в фиксированном порядке. */
export const Mobile = () => (
  <div style={phone}>
    <BottomNavigation items={ITEMS} />
  </div>
);
