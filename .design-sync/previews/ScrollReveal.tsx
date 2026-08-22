import { ScrollReveal } from 'suetavpn';

const card: React.CSSProperties = {
  padding: 24,
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
};

/** Блок появляется один раз, когда попадает в область просмотра. */
export const Section = () => (
  <ScrollReveal as="section" style={card}>
    <h2 style={{ margin: '0 0 8px', color: 'var(--color-text-strong)' }}>Всё необходимое</h2>
    <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
      Секции лендинга ниже первого экрана используют эту обёртку.
    </p>
  </ScrollReveal>
);

/** Задержка сдвигает появление, чтобы соседние блоки шли каскадом. */
export const Delayed = () => (
  <div style={{ display: 'grid', gap: 12 }}>
    <ScrollReveal delay={0} style={card}>Первый блок, без задержки</ScrollReveal>
    <ScrollReveal delay={80} style={card}>Второй, задержка 80 мс</ScrollReveal>
    <ScrollReveal delay={160} style={card}>Третий, задержка 160 мс</ScrollReveal>
  </div>
);
