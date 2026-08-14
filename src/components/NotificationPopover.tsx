import { useCallback, useEffect, useMemo, useRef, useState, type JSX, type RefObject } from 'react';
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
  const ticketEvents = useMemo(() => notifications.filter(
    ({ type }) => type === 'ticket-created' || type === 'ticket-replied',
  ), [notifications]);
  const unreadCount = ticketEvents.filter(({ read }) => !read).length;
  const close = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

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
      aria-modal={open ? 'false' : undefined}
      className="notification-popover"
      data-state={open ? 'open' : 'closing'}
      inert={!open}
      onAnimationEnd={() => {
        if (!open) setMounted(false);
      }}
      role="dialog"
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
