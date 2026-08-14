import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { Locale } from '../domain/types';
import {
  getMessage,
  type MessageKey,
  type MessageVariables,
} from './messages';

const DATE_LOCALES: Readonly<Record<Locale, string>> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export interface I18nValue {
  locale: Locale;
  t: (key: MessageKey, variables?: MessageVariables) => string;
  formatMoney: (value: number) => string;
  formatDate: (value: string | Date) => string;
  setLocale: (locale: Locale) => void;
}

interface I18nProviderProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  children: ReactNode;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  setLocale,
  children,
}: I18nProviderProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const intlLocale = DATE_LOCALES[locale];
    const moneyFormatter = new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    });
    const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
      dateStyle: 'long',
      timeZone: 'UTC',
    });

    return {
      locale,
      setLocale,
      t: (key, variables) => getMessage(locale, key, variables),
      formatMoney: (amount) => moneyFormatter.format(amount),
      formatDate: (date) => dateFormatter.format(new Date(date)),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
