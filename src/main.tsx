import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';

// Без ready() Telegram держит сплэш поверх окна, без expand() мини-апп
// открывается в половину экрана. Оба вызова безопасны вне Telegram.
const telegram = (window as unknown as {
  Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } };
}).Telegram?.WebApp;
telegram?.ready?.();
telegram?.expand?.();

// Бандл дизайн-системы (claude.ai/design) импортирует этот модуль ради стилей,
// а контейнера #root на странице карточки нет. Без проверки монтирование
// падало бы и обрывало инициализацию всего бандла.
const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
