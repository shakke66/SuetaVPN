import { createContext, useCallback, useContext, useMemo, useRef, useState, type JSX, type ReactNode } from 'react';
import { ToastRegion, type ToastMessage } from '../components/ToastRegion';

type ToastInput = Omit<ToastMessage, 'id'>;

interface ToastValue {
  /** Показывает всплывающее сообщение поверх интерфейса. */
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
}

/** Больше трёх сообщений сразу на экране не держим — нижние вытесняются. */
const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [messages, setMessages] = useState<readonly ToastMessage[]>([]);
  const sequenceRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    sequenceRef.current += 1;
    const id = `toast-${sequenceRef.current}`;
    setMessages((current) => [{ ...toast, id }, ...current].slice(0, MAX_VISIBLE));
  }, []);

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion messages={messages} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
