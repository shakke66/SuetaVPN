import { useRef } from 'react';
import { Button, Icon, NotificationPopover } from 'suetavpn';

const noop = () => {};
const asyncNoop = async () => {};

const TICKETS = [
  {
    id: 'ticket-tv',
    subject: 'Не подключается на телевизоре',
    status: 'answered',
    createdAt: '2026-08-19T09:14:00.000Z',
    attachmentName: '',
    messages: [],
  },
  {
    id: 'ticket-payment',
    subject: 'Не прошла оплата картой',
    status: 'open',
    createdAt: '2026-08-18T17:02:00.000Z',
    attachmentName: '',
    messages: [],
  },
] as const;

const NOTIFICATIONS = [
  {
    id: 'notification-reply',
    type: 'ticket-replied',
    ticketId: 'ticket-tv',
    read: false,
    readAt: null,
    createdAt: '2026-08-19T10:31:00.000Z',
  },
  {
    id: 'notification-created',
    type: 'ticket-created',
    ticketId: 'ticket-payment',
    read: false,
    readAt: null,
    createdAt: '2026-08-18T17:02:00.000Z',
  },
  {
    id: 'notification-old',
    type: 'ticket-replied',
    ticketId: 'ticket-payment',
    read: true,
    readAt: '2026-08-18T18:40:00.000Z',
    createdAt: '2026-08-18T18:22:00.000Z',
  },
] as const;

/** Панель событий по обращениям: два непрочитанных и одно прочитанное. */
export const WithNotifications = () => {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ minHeight: 360 }}>
      <div className="notification-anchor">
        <Button ref={trigger} aria-label="Открыть уведомления" iconOnly variant="utility">
          <Icon name="bell" />
          <span className="notification-badge">2</span>
        </Button>
      </div>
      <NotificationPopover
        notifications={NOTIFICATIONS}
        onClose={noop}
        onMarkAllRead={asyncNoop}
        onMarkRead={asyncNoop}
        open
        tickets={TICKETS}
        triggerRef={trigger}
      />
    </div>
  );
};

/** Событий ещё не было — панель показывает пустое состояние. */
export const EmptyState = () => {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ minHeight: 280 }}>
      <div className="notification-anchor">
        <Button ref={trigger} aria-label="Открыть уведомления" iconOnly variant="utility">
          <Icon name="bell" />
        </Button>
      </div>
      <NotificationPopover
        notifications={[]}
        onClose={noop}
        onMarkAllRead={asyncNoop}
        onMarkRead={asyncNoop}
        open
        tickets={[]}
        triggerRef={trigger}
      />
    </div>
  );
};
