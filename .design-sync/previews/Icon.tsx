import { Icon } from 'suetavpn';
import type { IconName } from 'suetavpn';

const NAVIGATION: readonly IconName[] = [
  'dashboard', 'subscriptions', 'balance', 'referral', 'support', 'info', 'profile',
];

const UTILITY: readonly IconName[] = [
  'bell', 'menu', 'close', 'sun', 'moon', 'logout', 'globe', 'chevron-right',
];

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
  gap: 16,
};

const cell: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: '14px 8px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-panel)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: 12,
};

function Cell({ name }: { name: IconName }) {
  return (
    <div style={cell}>
      <Icon name={name} size={24} />
      <span style={{ color: 'var(--color-text-muted)' }}>{name}</span>
    </div>
  );
}

/** Иконки разделов — используются в шапке, выдвижном меню и нижней навигации. */
export const Navigation = () => (
  <div style={grid}>
    {NAVIGATION.map((name) => <Cell key={name} name={name} />)}
  </div>
);

/** Служебные иконки — управление темой, меню, уведомления, выход. */
export const Utility = () => (
  <div style={grid}>
    {UTILITY.map((name) => <Cell key={name} name={name} />)}
  </div>
);

/** Размер задаётся пропом size, цвет наследуется от родителя. */
export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: 'var(--color-text)' }}>
    <Icon name="subscriptions" size={16} />
    <Icon name="subscriptions" size={20} />
    <Icon name="subscriptions" size={24} />
    <Icon name="subscriptions" size={32} />
    <span style={{ color: 'var(--color-brand)' }}><Icon name="subscriptions" size={40} /></span>
  </div>
);
