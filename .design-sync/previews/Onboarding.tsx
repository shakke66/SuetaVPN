import { Icon, Onboarding } from 'suetavpn';

const noop = () => {};

const nav: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  padding: 6,
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  width: 'fit-content',
};

const item: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--color-text)',
  fontSize: 14,
};

/**
 * Подсказка первого запуска.
 *
 * Overlay подсвечивает элемент с атрибутом data-onboarding-target и ставит
 * рядом карточку с текстом, поэтому в превью нужна цель — здесь это
 * навигация, как в шапке кабинета.
 */
export const Step = () => (
  <div style={{ minHeight: 320 }}>
    <nav data-onboarding-target="navigation" style={nav}>
      <span style={{ ...item, background: 'var(--color-surface-raised)' }}>
        <Icon name="dashboard" size={18} />Главная
      </span>
      <span style={item}><Icon name="subscriptions" size={18} />Подписки</span>
      <span style={item}><Icon name="balance" size={18} />Баланс</span>
      <span style={item}><Icon name="referral" size={18} />Рефералы</span>
      <span style={item}><Icon name="support" size={18} />Поддержка</span>
    </nav>
    <Onboarding onComplete={noop} open />
  </div>
);
