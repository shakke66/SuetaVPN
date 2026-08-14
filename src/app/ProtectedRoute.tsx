import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useApp } from './AppProvider';

function RememberProtectedPath({ path }: { path: string }) {
  const { returnPath, setReturnPath } = useApp();

  useEffect(() => {
    setReturnPath(path);
  }, [path, setReturnPath]);

  if (returnPath !== path) return null;
  return <Navigate to="/auth" replace />;
}

export function ProtectedRoute() {
  const { returnPath, setReturnPath, state } = useApp();
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (state.session.active && returnPath === currentPath) {
      setReturnPath(null);
    }
  }, [currentPath, returnPath, setReturnPath, state.session.active]);

  if (!state.session.active) {
    return <RememberProtectedPath path={currentPath} />;
  }

  return <Outlet />;
}
