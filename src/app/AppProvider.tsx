import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createInitialState } from '../domain/state';
import { hydrateState, STORAGE_KEY, LEGACY_STORAGE_KEY } from '../domain/migrations';
import type { AppStateV2, Locale, Period, Result, TariffId, Theme } from '../domain/types';
import type { CreateTicketRequest, TopUpRequest } from '../domain/operations';
import { createLocalAdapters } from '../adapters/local/createLocalAdapters';
import { I18nProvider } from '../i18n/I18nProvider';

export interface AppContextValue { state: AppStateV2; pending: string[]; setTheme: (theme: Theme) => Promise<void>; setLocale: (locale: Locale) => Promise<void>; topUp: (request: TopUpRequest) => Promise<Result<AppStateV2>>; applyPromo: (code: string) => Promise<Result<AppStateV2>>; purchase: (tariff: TariffId, months: Period) => Promise<Result<AppStateV2>>; createTicket: (request: CreateTicketRequest) => Promise<Result<AppStateV2>>; replyTicket: (id: string, message: string) => Promise<Result<AppStateV2>>; markNotificationRead: (id: string) => Promise<Result<AppStateV2>>; markAllNotificationsRead: () => Promise<Result<AppStateV2>> }
const Context = createContext<AppContextValue | null>(null);
const adapters = createLocalAdapters();
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => hydrateState(localStorage.getItem(STORAGE_KEY), localStorage.getItem(LEGACY_STORAGE_KEY)));
  const [pending, setPending] = useState<string[]>([]);
  const run = useCallback(async <T,>(name: string, fn: () => Promise<Result<AppStateV2>>): Promise<Result<AppStateV2>> => { setPending(p => [...p,name]); try { const result = await fn(); if (result.ok) { setState(result.state); localStorage.setItem(STORAGE_KEY, JSON.stringify(result.state)); } return result; } finally { setPending(p => p.filter(x => x !== name)); } }, []);
  const setTheme = useCallback(async (theme: Theme) => { setState(s => { const n = { ...s, preferences: { ...s.preferences, theme } }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; }); document.documentElement.dataset.theme = theme; }, []);
  const setLocale = useCallback(async (locale: Locale) => { setState(s => { const n = { ...s, preferences: { ...s.preferences, locale } }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; }); }, []);
  const value = useMemo<AppContextValue>(() => ({ state, pending, setTheme, setLocale, topUp: r => run('topUp', () => adapters.billing.topUp(state,r)), applyPromo: c => run('applyPromo', () => adapters.billing.applyPromo(state,c)), purchase: (t,m) => run('purchase', () => adapters.subscriptions.purchase(state,t,m)), createTicket: r => run('createTicket', () => adapters.tickets.create(state,r)), replyTicket: (id,m) => run('replyTicket', () => adapters.tickets.reply(state,id,m)), markNotificationRead: id => run('markNotificationRead', () => adapters.notifications.markRead(state,id)), markAllNotificationsRead: () => run('markAllNotificationsRead', () => adapters.notifications.markAllRead(state)) }), [state,pending,setTheme,setLocale,run]);
  return <Context.Provider value={value}><I18nProvider locale={state.preferences.locale} setLocale={setLocale}>{children}</I18nProvider></Context.Provider>;
}
export function useApp(): AppContextValue { const value = useContext(Context); if (!value) throw new Error('useApp must be used within AppProvider'); return value; }
