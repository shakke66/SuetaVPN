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
import type {
  EmailChallenge,
  LocalAdapters,
  StartEmailResult,
  TelegramUser,
} from '../adapters/contracts';
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
import { I18nProvider, useI18n } from '../i18n/I18nProvider';
import { ToastRegion } from '../components/ToastRegion';

export type CommandName =
  | 'startEmail'
  | 'verifyEmail'
  | 'loginTelegram'
  | 'logout'
  | 'topUp'
  | 'applyPromo'
  | 'purchase'
  | 'createTicket'
  | 'replyTicket'
  | 'markNotificationRead'
  | 'markAllNotificationsRead';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface AppContextValue {
  state: AppStateV2;
  pending: CommandName[];
  emailChallenge: EmailChallenge | null;
  returnPath: string | null;
  telegramMiniApp: boolean;
  telegramUser: TelegramUser | null;
  setReturnPath: (path: string | null) => void;
  startEmail: (email: string) => Promise<StartEmailResult>;
  verifyEmail: (code: string) => Promise<Result<AppStateV2>>;
  loginTelegram: () => Promise<Result<AppStateV2>>;
  logout: () => Promise<Result<AppStateV2>>;
  setTheme: (theme: Theme) => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  setPurchaseDraft: (tariffId: TariffId, months: Period) => Promise<void>;
  setAutoRenew: (autoRenew: boolean) => Promise<void>;
  setAvatar: (avatar: string | null) => Promise<void>;
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

interface HydratedStorage {
  persistenceWarning: boolean;
  state: AppStateV2;
}

function hydrateStoredState(): HydratedStorage {
  try {
    return {
      persistenceWarning: false,
      state: hydrateState(
        localStorage.getItem(STORAGE_KEY),
        localStorage.getItem(LEGACY_STORAGE_KEY),
      ),
    };
  } catch {
    return { persistenceWarning: true, state: hydrateState(null, null) };
  }
}

/* Провайдер уведомлений живёт ниже по дереву, поэтому предупреждение о
   недоступном хранилище показываем собственной областью — и не гасим само:
   без сохранения данные живут только до закрытия вкладки. */
function PersistenceWarning({ onDismiss, visible }: {
  onDismiss: () => void;
  visible: boolean;
}) {
  const { t } = useI18n();
  return (
    <ToastRegion
      messages={visible ? [{ id: 'persistence-warning', kind: 'error', sticky: true, text: t('common.persistenceWarning') }] : []}
      onDismiss={onDismiss}
    />
  );
}

function pendingResult(
  state: AppStateV2,
): Extract<Result<AppStateV2>, { ok: false }> {
  return {
    ok: false,
    state,
    code: 'COMMAND_PENDING',
    messageKey: 'common.commandPending',
  };
}

export function AppProvider({ children, adapters = defaultAdapters }: AppProviderProps) {
  const [hydrated] = useState(hydrateStoredState);
  const [state, setRenderedState] = useState(hydrated.state);
  const [persistenceWarning, setPersistenceWarning] = useState(hydrated.persistenceWarning);
  const [emailChallenge, setEmailChallenge] = useState<EmailChallenge | null>(null);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const telegramUser = useMemo(() => adapters.auth.detectTelegramUser(), [adapters]);
  const stateRef = useRef(state);
  const queueRef = useRef(Promise.resolve());
  const themeTransitionTimeoutRef = useRef<number | null>(null);
  const pendingRef = useRef(new Set<CommandName>());
  const miniAppLoginStartedRef = useRef(false);
  const [pending, setPending] = useState<CommandName[]>([]);

  const commit = useCallback((nextState: AppStateV2) => {
    stateRef.current = nextState;
    setRenderedState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      setPersistenceWarning(true);
    }
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

  const setTheme = useCallback(async (theme: Theme) => {
    const root = document.documentElement;
    const animate = !prefersReducedMotion();
    if (themeTransitionTimeoutRef.current !== null) {
      window.clearTimeout(themeTransitionTimeoutRef.current);
      themeTransitionTimeoutRef.current = null;
    }
    if (animate) root.dataset.themeTransition = 'active';

    await enqueueStateUpdate((current) => ({
      ...current,
      preferences: { ...current.preferences, theme },
    }));

    if (animate) {
      themeTransitionTimeoutRef.current = window.setTimeout(() => {
        delete root.dataset.themeTransition;
        themeTransitionTimeoutRef.current = null;
      }, 420);
    }
  }, [enqueueStateUpdate]);

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

  const setAutoRenew = useCallback((autoRenew: boolean) => (
    enqueueStateUpdate((current) => (current.subscription === null ? current : {
      ...current,
      subscription: { ...current.subscription, autoRenew },
    }))
  ), [enqueueStateUpdate]);

  const setAvatar = useCallback((avatarValue: string | null) => (
    enqueueStateUpdate((current) => ({
      ...current,
      profile: { ...current.profile, avatar: avatarValue },
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

  useEffect(() => () => {
    if (themeTransitionTimeoutRef.current !== null) {
      window.clearTimeout(themeTransitionTimeoutRef.current);
    }
    delete document.documentElement.dataset.themeTransition;
  }, []);

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

  const startEmail = useCallback(async (email: string): Promise<StartEmailResult> => {
    if (pendingRef.current.has('startEmail')) {
      return pendingResult(stateRef.current);
    }

    pendingRef.current.add('startEmail');
    setPending(Array.from(pendingRef.current));
    try {
      const result = await adapters.auth.startEmail(stateRef.current, email);
      if (result.ok) setEmailChallenge(result.challenge);
      return result;
    } finally {
      pendingRef.current.delete('startEmail');
      setPending(Array.from(pendingRef.current));
    }
  }, [adapters]);

  const verifyEmail = useCallback(async (code: string) => {
    const result = await run(
      'verifyEmail',
      (current) => adapters.auth.verifyEmail(current, emailChallenge, code),
    );
    if (result.ok) setEmailChallenge(null);
    return result;
  }, [adapters, emailChallenge, run]);

  const loginTelegram = useCallback(() => run(
    'loginTelegram',
    (current) => adapters.auth.loginTelegram(current, telegramUser),
  ), [adapters, run, telegramUser]);

  useEffect(() => {
    if (!telegramUser || state.session.active || miniAppLoginStartedRef.current) return;
    miniAppLoginStartedRef.current = true;
    void loginTelegram();
  }, [loginTelegram, state.session.active, telegramUser]);

  const logout = useCallback((): Promise<Result<AppStateV2>> => {
    if (telegramUser) {
      return Promise.resolve({
        ok: true,
        state: stateRef.current,
        code: 'success',
        messageKey: 'auth.telegram.success',
      });
    }
    return run('logout', (current) => adapters.auth.logout(current));
  }, [adapters, run, telegramUser]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    pending,
    emailChallenge,
    returnPath,
    telegramMiniApp: telegramUser !== null,
    telegramUser,
    setReturnPath,
    startEmail,
    verifyEmail,
    loginTelegram,
    logout,
    setTheme,
    setLocale,
    setPurchaseDraft,
    setAutoRenew,
    setAvatar,
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
    emailChallenge,
    loginTelegram,
    logout,
    pending,
    returnPath,
    run,
    startEmail,
    setAutoRenew,
    setAvatar,
    setLocale,
    setPurchaseDraft,
    setTheme,
    state,
    telegramUser,
    verifyEmail,
  ]);

  return (
    <AppContext.Provider value={value}>
      <I18nProvider locale={state.preferences.locale} setLocale={setLocale}>
        {children}
        <PersistenceWarning
          onDismiss={() => setPersistenceWarning(false)}
          visible={persistenceWarning}
        />
      </I18nProvider>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
}
