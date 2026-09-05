import { useEffect, type JSX } from 'react';
import { HashRouter } from 'react-router';
import type { LocalAdapters } from '../adapters/contracts';
import { AppProvider } from './AppProvider';
import { startHaptics } from './haptics';
import { ToastProvider } from './ToastProvider';
import { AppRoutes } from './routes';

interface AppProps {
  adapters?: LocalAdapters;
}

export function App({ adapters }: AppProps): JSX.Element {
  // Тактильный отклик мини-приложения: вне Telegram обработчик молчит.
  useEffect(() => startHaptics(), []);

  return (
    <AppProvider adapters={adapters}>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  );
}
