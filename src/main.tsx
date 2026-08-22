import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';

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
