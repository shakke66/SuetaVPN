import { useEffect, useId, useRef, useState, type JSX } from 'react';
import { useApp } from '../app/AppProvider';
import type { Locale } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { Button } from './Button';
import { Icon } from './Icon';

const LANGUAGE_OPTIONS = [
  { code: 'RU', flag: 'ru', labelKey: 'shell.language.russian', locale: 'ru' },
  { code: 'EN', flag: 'us', labelKey: 'shell.language.english', locale: 'en' },
] as const satisfies readonly {
  code: string;
  flag: 'ru' | 'us';
  labelKey: MessageKey;
  locale: Locale;
}[];

interface LanguageMenuProps {
  readonly drawer?: boolean;
}

function FlagIcon({ country }: { readonly country: 'ru' | 'us' }): JSX.Element {
  if (country === 'ru') {
    return (
      <svg aria-hidden="true" className="language-flag" shapeRendering="crispEdges" viewBox="0 0 24 16">
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.34" y="5.33" fill="#1c57a7" />
        <rect width="24" height="5.33" y="10.67" fill="#d52b1e" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="language-flag" shapeRendering="crispEdges" viewBox="0 0 24 16">
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="1.24" y="0" fill="#b22234" />
      <rect width="24" height="1.24" y="2.46" fill="#b22234" />
      <rect width="24" height="1.24" y="4.92" fill="#b22234" />
      <rect width="24" height="1.24" y="7.38" fill="#b22234" />
      <rect width="24" height="1.24" y="9.84" fill="#b22234" />
      <rect width="24" height="1.24" y="12.3" fill="#b22234" />
      <rect width="24" height="1.24" y="14.76" fill="#b22234" />
      <rect width="10.4" height="8.62" fill="#3c3b6e" />
      <g fill="#fff">
        <circle cx="2" cy="2" r="0.55" />
        <circle cx="5.2" cy="2" r="0.55" />
        <circle cx="8.4" cy="2" r="0.55" />
        <circle cx="3.6" cy="4.3" r="0.55" />
        <circle cx="6.8" cy="4.3" r="0.55" />
        <circle cx="2" cy="6.6" r="0.55" />
        <circle cx="5.2" cy="6.6" r="0.55" />
        <circle cx="8.4" cy="6.6" r="0.55" />
      </g>
    </svg>
  );
}

export function LanguageMenu({ drawer = false }: LanguageMenuProps): JSX.Element {
  const { setLocale } = useApp();
  const { locale, t } = useI18n();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const currentOptionRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const current = LANGUAGE_OPTIONS.find((option) => option.locale === locale) ?? LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    currentOptionRef.current?.focus();

    const closeOnPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const chooseLocale = async (nextLocale: Locale) => {
    setOpen(false);
    if (nextLocale === locale || changing) {
      triggerRef.current?.focus();
      return;
    }

    setChanging(true);
    try {
      // Keep the shell mounted and change only the message tree. A full-main
      // opacity animation made the header visibly blink on every locale swap.
      await setLocale(nextLocale);
    } finally {
      setChanging(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={drawer ? 'language-menu language-menu--drawer' : 'language-menu'}
      data-open={open ? 'true' : 'false'}
    >
      <Button
        ref={triggerRef}
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('shell.language.choose')}
        className="locale-control language-menu__trigger"
        disabled={changing}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        variant="utility"
      >
        <FlagIcon country={current.flag} />
        <span>{current.code}</span>
        <Icon aria-hidden="true" className="language-menu__chevron" name="chevron-right" size={15} />
      </Button>
      <div
        id={menuId}
        aria-hidden={open ? undefined : 'true'}
        className="language-menu__popover"
        inert={!open}
        role="menu"
      >
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = option.locale === locale;
          return (
            <button
              ref={selected ? currentOptionRef : undefined}
              aria-checked={selected}
              className="language-menu__option"
              disabled={changing}
              key={option.locale}
              onClick={() => void chooseLocale(option.locale)}
              role="menuitemradio"
              type="button"
            >
              <FlagIcon country={option.flag} />
              <span>{t(option.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
