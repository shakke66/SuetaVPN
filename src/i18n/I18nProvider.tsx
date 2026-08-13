import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../domain/types';
import { getMessage, type MessageKey } from './messages';

interface I18nValue { locale: Locale; t: (key: MessageKey, vars?: Record<string, string | number>) => string; formatMoney: (value: number) => string; formatDate: (value: string | Date) => string; setLocale: (locale: Locale) => void }
const Context = createContext<I18nValue | null>(null);
export function I18nProvider({ locale, setLocale, children }: { locale: Locale; setLocale: (locale: Locale) => void; children: ReactNode }) {
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t: (k,v) => getMessage(locale,k,v), formatMoney: (n) => new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n), formatDate: (d) => new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US').format(new Date(d)) }), [locale, setLocale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n(): I18nValue { const value = useContext(Context); if (!value) throw new Error('useI18n must be used within I18nProvider'); return value; }
