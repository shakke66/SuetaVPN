import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
  type RefObject,
} from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Icon } from './Icon';

interface DrawerProps {
  active?: boolean;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true' && !element.closest('[inert]'),
  );
}

export function Drawer({
  active = true,
  children,
  open,
  onClose,
  returnFocusRef,
}: DrawerProps): JSX.Element | null {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openedRef = useRef(false);
  const [mounted, setMounted] = useState(open);
  const close = useCallback(() => {
    onClose();
    returnFocusRef.current?.focus();
  }, [onClose, returnFocusRef]);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    if (mounted && !openedRef.current) {
      openedRef.current = true;
      closeButtonRef.current?.focus();
    }
  }, [mounted, open]);

  useLayoutEffect(() => {
    if (!active || !open || !mounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = focusableElements(dialogRef.current);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !dialogRef.current.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialogRef.current.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, close, mounted, open]);

  if (!mounted) return null;
  return (
    <div
      aria-hidden={open && active ? undefined : 'true'}
      className="drawer-backdrop"
      data-state={open ? 'open' : 'closing'}
      inert={!open || !active}
      onAnimationEnd={() => {
        if (!open) setMounted(false);
      }}
      onPointerDown={(event) => {
        if (active && open && event.target === event.currentTarget) close();
      }}
    >
      <aside
        ref={dialogRef}
        aria-label={t('shell.drawer.title')}
        aria-modal={active && open ? 'true' : undefined}
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
