import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode, type RefObject } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Icon } from './Icon';

interface DrawerProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

export function Drawer({ children, open, onClose, returnFocusRef }: DrawerProps): JSX.Element | null {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(open);
  const close = useCallback(() => {
    onClose();
    returnFocusRef.current?.focus();
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open || !mounted) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, mounted, open]);

  if (!mounted) return null;
  return (
    <div
      aria-hidden={open ? undefined : 'true'}
      className="drawer-backdrop"
      data-state={open ? 'open' : 'closing'}
      inert={!open}
      onAnimationEnd={() => {
        if (!open) setMounted(false);
      }}
      onPointerDown={(event) => {
        if (open && event.target === event.currentTarget) close();
      }}
    >
      <aside
        ref={dialogRef}
        aria-label={t('shell.drawer.title')}
        aria-modal={open ? 'true' : undefined}
        className="drawer"
        role="dialog"
        tabIndex={-1}
      >
        <div className="drawer__header">
          <h2>{t('shell.drawer.title')}</h2>
          <Button
            ref={closeButtonRef}
            aria-label={t('shell.drawer.close')}
            iconOnly
            onClick={close}
            variant="utility"
          >
            <Icon name="close" />
          </Button>
        </div>
        {children}
      </aside>
    </div>
  );
}
