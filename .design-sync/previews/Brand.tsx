import { Brand } from 'suetavpn';

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 32,
  flexWrap: 'wrap',
};

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '14px 20px',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
};

/** Обычный и компактный вариант логотипа рядом. */
export const Variants = () => (
  <div style={row}>
    <Brand />
    <Brand compact />
  </div>
);

/** Как логотип выглядит в шапке — слева, рядом с утилитами. */
export const InHeader = () => (
  <div style={header}>
    <Brand compact to="/" />
    <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
      Личный кабинет
    </span>
  </div>
);
