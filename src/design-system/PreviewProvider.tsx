import type { CSSProperties, JSX, ReactNode } from 'react';
import { HashRouter } from 'react-router';
import { AppProvider } from '../app/AppProvider';

/**
 * Контекст для превью компонентов в дизайн-системе claude.ai/design.
 *
 * Приложением не используется и в production-сборку не попадает: файл не входит
 * в граф импортов `main.tsx`. Он существует только ради `cfg.provider` в
 * `.design-sync/config.json` — почти каждому компоненту нужен `I18nProvider`
 * (его создаёт `AppProvider`), а `Brand`, `BottomNavigation` и
 * `NotificationPopover` дополнительно требуют роутер.
 *
 * Карточка превью рендерит компонент в собственную ячейку, а не в `body`,
 * поэтому фон и цвет текста задаются здесь явно: иначе светлый текст тёмной
 * темы оказывается на белом фоне ячейки и не читается.
 */
const surface: CSSProperties = {
  padding: 20,
  borderRadius: 'var(--radius-card)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

export function PreviewProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <AppProvider>
      <HashRouter>
        <div style={surface}>{children}</div>
      </HashRouter>
    </AppProvider>
  );
}
