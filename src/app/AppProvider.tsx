import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LocalAdapters } from '../adapters/contracts';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { LEGACY_STORAGE_KEY, STORAGE_KEY, hydrateState } from '../domain/migrations';
import type { CreateTicketRequest, TopUpRequest } from '../domain/operations';
import type {
  AppStateV2,
  Locale,
  Period,
  Result,
  TariffId,
  Theme,
} from '../domain/types';
import { I18nProvider } from '../i18n/I18nProvider';

export type CommandName =
  | 'topUp'
  | 'applyPromo'
  | 'purchase'
  | 'createTicket'
  | 'replyTicket'
  | 'markNotificationRead'
  | 'markAllNotificationsRead';

export interface AppContextValue {
  state: AppStateV2;
  pending: CommandName[];
  setTheme: (theme: Theme) => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  setPurchaseDraft: (tariffId: TariffId, months: Period) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  topUp: (request: TopUpRequest) => Promise<Result<AppStateV2>>;
  applyPromo: (code: string) => Promise<Result<AppStateV2>>;
  purchase: (tariffId: TariffId, months: Period) => Promise<Result<AppStateV2>>;
  createTicket: (request: CreateTicketRequest) => Promise<Result<AppStateV2>>;
  replyTicket: (ticketId: string, message: string) => Promise<Result<AppStateV2>>;
  markNotificationRead: (notificationId: string) => Promise<Result<AppStateV2>>;
  markAllNotificationsRead: () => Promise<Result<AppStateV2>>;
}

interface AppProviderProps {
  children: ReactNode;
  adapters?: LocalAdapters;
}

type Transition = (state: AppStateV2) => Promise<Result<AppStateV2>>;

const AppContext = createContext<AppContextValue | null>(null);
const defaultAdapters = createLocalAdapters();

function hydrateStoredState(): AppStateV2 {
  return hydrateState(
    localStorage.getItem(STORAGE_KEY),
    localStorage.getItem(LEGACY_STORAGE_KEY),
  );
}

function pendingResult(state: AppStateV2): Result<AppStateV2> {
  return {
    ok: false,
    state,
    code: 'COMMAND_PENDING',
    messageKey: 'common.commandPending',
  };
}

export function AppProvider({ children, adapters = defaultAdapters }: AppProviderProps) {
  const [state, setRenderedState] = useState(hydrateStoredState);
  const stateRef = useRef(state);
  const queueRef = useRef(Promise.resolve());
  const pendingRef = useRef(new Set<CommandName>());
  const [pending, setPending] = useState<CommandName[]>([]);

  const commit = useCallback((nextState: AppStateV2) => {
    stateRef.current = nextState;
    setRenderedState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, []);

  const enqueueStateUpdate = useCallback((
    update: (current: AppStateV2) => AppStateV2,
  ): Promise<void> => {
    const execute = () => {
      commit(update(stateRef.current));
    };
    const result = queueRef.current.then(execute, execute);
    queueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [commit]);

  const setTheme = useCallback((theme: Theme) => (
    enqueueStateUpdate((current) => ({
      ...current,
      preferences: { ...current.preferences, theme },
    }))
  ), [enqueueStateUpdate]);

  const setLocale = useCallback((locale: Locale) => (
    enqueueStateUpdate((current) => ({
      ...current,
      preferences: { ...current.preferences, locale },
    }))
  ), [enqueueStateUpdate]);

  const setPurchaseDraft = useCallback((tariffId: TariffId, months: Period) => (
    enqueueStateUpdate((current) => ({
      ...current,
      purchaseDraft: { tariffId, months },
    }))
  ), [enqueueStateUpdate]);

  const completeOnboarding = useCallback(() => (
    enqueueStateUpdate((current) => ({
      ...current,
      preferences: { ...current.preferences, onboardingCompleted: true },
    }))
  ), [enqueueStateUpdate]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.preferences.theme;
  }, [state.preferences.theme]);

  const run = useCallback((name: CommandName, transition: Transition) => {
    if (pendingRef.current.has(name)) {
      return Promise.resolve(pendingResult(stateRef.current));
    }

    pendingRef.current.add(name);
    setPending(Array.from(pendingRef.current));

    const execute = async () => {
      try {
        const result = await transition(stateRef.current);
        if (result.ok) commit(result.state);
        return result;
      } finally {
        pendingRef.current.delete(name);
        setPending(Array.from(pendingRef.current));
      }
    };

    const result = queueRef.current.then(execute, execute);
    queueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [commit]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    pending,
    setTheme,
    setLocale,
    setPurchaseDraft,
    completeOnboarding,
    topUp: (request) => run(
      'topUp',
      (current) => adapters.billing.topUp(current, request),
    ),
    applyPromo: (code) => run(
      'applyPromo',
      (current) => adapters.billing.applyPromo(current, code),
    ),
    purchase: (tariffId, months) => run(
      'purchase',
      (current) => adapters.subscriptions.purchase(current, tariffId, months),
    ),
    createTicket: (request) => run(
      'createTicket',
      (current) => adapters.tickets.create(current, request),
    ),
    replyTicket: (ticketId, message) => run(
      'replyTicket',
      (current) => adapters.tickets.reply(current, ticketId, message),
    ),
    markNotificationRead: (notificationId) => run(
      'markNotificationRead',
      (current) => adapters.notifications.markRead(current, notificationId),
    ),
    markAllNotificationsRead: () => run(
      'markAllNotificationsRead',
      (current) => adapters.notifications.markAllRead(current),
    ),
  }), [
    adapters,
    completeOnboarding,
    pending,
    run,
    setLocale,
    setPurchaseDraft,
    setTheme,
    state,
  ]);

  return (
    <AppContext.Provider value={value}>
      <I18nProvider locale={state.preferences.locale} setLocale={setLocale}>
        {children}
      </I18nProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
