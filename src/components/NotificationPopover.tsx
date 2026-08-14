import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type RefObject,
} from 'react';
import { Link } from 'react-router';
import type { Ticket, TicketNotification } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Icon } from './Icon';

interface NotificationPopoverProps {
  notifications: readonly TicketNotification[];
  tickets: readonly Ticket[];
  open: boolean;
  onClose: () => void;
  onMarkAllRead: () => Promise<unknown>;
  onMarkRead: (notificationId: string) => Promise<unknown>;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

interface AnchorPosition {
  left: number;
  top: number;
}

const DESKTOP_POPOVER_MAX_WIDTH = 390;
const DESKTOP_POPOVER_EDGE = 16;
const DESKTOP_POPOVER_GAP = 12;
const DESKTOP_POPOVER_NARROW_GUTTER = 24;

export function NotificationPopover({
  notifications,
  tickets,
  open,
  onClose,
  onMarkAllRead,
  onMarkRead,
  triggerRef,
}: NotificationPopoverProps): JSX.Element | null {
  const { formatDate, t } = useI18n();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(open);
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null);
  const openerKind = triggerRef.current?.dataset.notificationOpener === 'drawer'
    ? 'drawer'
    : 'desktop';
  const ticketEvents = useMemo(() => notifications.filter(
    ({ type }) => type === 'ticket-created' || type === 'ticket-replied',
  ), [notifications]);
  const unreadCount = ticketEvents.filter(({ read }) => !read).length;
  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !mounted) return;
    if (openerKind === 'drawer') {
      setAnchorPosition(null);
      return;
    }

    const updatePosition = () => {
      const opener = triggerRef.current;
      if (!opener) return;
      const openerRect = opener.getBoundingClientRect();
      const measuredWidth = panelRef.current?.getBoundingClientRect().width ?? 0;
      const fallbackWidth = Math.min(
        DESKTOP_POPOVER_MAX_WIDTH,
        Math.max(0, window.innerWidth - (DESKTOP_POPOVER_NARROW_GUTTER * 2)),
      );
      const popoverWidth = measuredWidth || fallbackWidth;
      const maximumLeft = Math.max(
        DESKTOP_POPOVER_EDGE,
        window.innerWidth - popoverWidth - DESKTOP_POPOVER_EDGE,
      );
      const left = Math.min(
        maximumLeft,
        Math.max(DESKTOP_POPOVER_EDGE, openerRect.right - popoverWidth),
      );
      const top = Math.max(DESKTOP_POPOVER_EDGE, openerRect.bottom + DESKTOP_POPOVER_GAP);
      setAnchorPosition((current) => (
        current?.left === left && current.top === top ? current : { left, top }
      ));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [mounted, open, openerKind, triggerRef]);

  useEffect(() => {
    if (!open || !mounted) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [close, mounted, open, triggerRef]);

  if (!mounted) return null;
  return (
    <section
      ref={panelRef}
      aria-hidden={open ? undefined : 'true'}
      aria-label={t('ticketNotifications.title')}
      aria-modal={open ? (openerKind === 'drawer' ? 'true' : 'false') : undefined}
      className="notification-popover"
      data-anchor={openerKind}
      data-state={open ? 'open' : 'closing'}
      inert={!open}
      onAnimationEnd={() => {
        if (!open) setMounted(false);
      }}
      role="dialog"
      style={openerKind === 'desktop' && anchorPosition ? {
        left: `${anchorPosition.left}px`,
        right: 'auto',
        top: `${anchorPosition.top}px`,
      } : undefined}
      tabIndex={-1}
    >
      <div className="notification-popover__header">
        <h2>{t('ticketNotifications.title')}</h2>
        <Button
          ref={closeButtonRef}
          aria-label={t('common.actions.close')}
          iconOnly
          onClick={close}
          variant="utility"
        >
          <Icon name="close" />
        </Button>
      </div>
      {ticketEvents.length === 0 ? (
        <div className="notification-popover__empty">
          <Icon name="bell" size={28} />
          <p>{t('shell.notifications.empty')}</p>
        </div>
      ) : (
        <ul className="notification-list">
          {ticketEvents.map((notification) => {
            const ticket = tickets.find(({ id }) => id === notification.ticketId);
            const subject = ticket?.subject ?? t('navigation.support');
            const messageKey = notification.type === 'ticket-created'
              ? 'ticketNotifications.ticketCreated'
              : 'ticketNotifications.ticketReplied';
            return (
              <li className={notification.read ? 'notification-item' : 'notification-item notification-item--unread'} key={notification.id}>
                <Link
                  className="notification-item__link"
                  onClick={() => {
                    if (!notification.read) void onMarkRead(notification.id);
                    close();
                  }}
                  to="/support"
                >
                  <span>{t(messageKey, { name: subject })}</span>
                  <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {unreadCount > 0 ? (
        <Button className="notification-popover__mark-all" onClick={() => void onMarkAllRead()}>
          {t('shell.notifications.markAllRead')}
        </Button>
      ) : null}
    </section>
  );
}
