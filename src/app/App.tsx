import type { JSX } from 'react';
import { HashRouter } from 'react-router';
import type { LocalAdapters } from '../adapters/contracts';
import { AppProvider } from './AppProvider';
import { AppRoutes } from './routes';

interface AppProps {
  adapters?: LocalAdapters;
}

export function App({ adapters }: AppProps): JSX.Element {
  return (
    <AppProvider adapters={adapters}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
