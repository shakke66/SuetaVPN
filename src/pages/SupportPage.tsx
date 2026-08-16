import { useEffect, useMemo, useRef, useState, type FormEvent, type JSX } from 'react';
import { useLocation } from 'react-router';
import { useApp } from '../app/AppProvider';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ToastRegion, type ToastMessage } from '../components/ToastRegion';
import type { Ticket } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

interface SupportLocationState {
  ticketId?: string;
}

interface TicketErrors {
  message?: string;
  subject?: string;
}

function requestedTicketId(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const ticketId = (value as SupportLocationState).ticketId;
  return typeof ticketId === 'string' ? ticketId : null;
}

function TicketConversation({ ticket }: { ticket: Ticket }): JSX.Element {
  const { formatDate, t } = useI18n();
  return (
    <ol aria-label={t('support.accessibility.conversation')} className="ticket-conversation">
      {ticket.messages.map((message) => (
        <li className={`ticket-message ticket-message--${message.author}`} key={message.id}>
          <strong>{message.author === 'support' ? t('navigation.support') : t('profile.name')}</strong>
          <p>{message.text}</p>
          <time dateTime={message.date}>{formatDate(message.date)}</time>
        </li>
      ))}
    </ol>
  );
}

export function SupportPage(): JSX.Element {
  const { createTicket, pending, replyTicket, state } = useApp();
  const { formatDate, t } = useI18n();
  const location = useLocation();
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [ticketErrors, setTicketErrors] = useState<TicketErrors>({});
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const selectedTicket = useMemo(
    () => state.tickets.find(({ id }) => id === selectedTicketId) ?? null,
    [selectedTicketId, state.tickets],
  );

  useEffect(() => {
    const requested = requestedTicketId(location.state);
    if (requested && state.tickets.some(({ id }) => id === requested)) {
      setSelectedTicketId(requested);
      return;
    }
    if (selectedTicketId && state.tickets.some(({ id }) => id === selectedTicketId)) return;
    setSelectedTicketId(state.tickets[0]?.id ?? null);
  }, [location.key, location.state, selectedTicketId, state.tickets]);

  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: TicketErrors = {};
    if (!subject.trim()) errors.subject = t('support.create.subjectRequired');
    if (!message.trim()) errors.message = t('support.create.messageRequired');
    setTicketErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = await createTicket({ attachmentName, message, subject });
    if (!result.ok) return;
    const created = result.state.tickets[0];
    setSelectedTicketId(created?.id ?? null);
    setSubject('');
    setMessage('');
    setAttachmentName('');
    setCreateOpen(false);
    setToast({ id: 'ticket-created', kind: 'success', text: t('support.create.success') });
  };

  const submitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyError(t('support.reply.messageRequired'));
      return;
    }
    if (!selectedTicket) return;
    setReplyError('');
    const result = await replyTicket(selectedTicket.id, reply);
    if (!result.ok) {
      setReplyError(t(result.messageKey as never));
      return;
    }
    setReply('');
    setToast({ id: 'ticket-replied', kind: 'success', text: t('support.reply.success') });
  };

  return (
    <section className="support-page">
      <div className="page-heading support-page__heading">
        <h1>{t('support.title')}</h1>
        <Button ref={createTriggerRef} onClick={() => setCreateOpen(true)}>{t('support.create.title')}</Button>
      </div>

      <div className="support-layout">
        <aside aria-label={t('support.accessibility.ticketList')} className="ticket-list-panel">
          <h2>{t('support.tickets.title')}</h2>
          {state.tickets.length === 0 ? (
            <p className="ticket-list__empty">{t('support.tickets.empty')}</p>
          ) : (
            <ul className="ticket-list">
              {state.tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    aria-label={ticket.subject}
                    aria-pressed={ticket.id === selectedTicketId}
                    className="ticket-list__button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    type="button"
                  >
                    <strong>{ticket.subject}</strong>
                    <span>{t(ticket.status === 'answered' ? 'support.tickets.statusAnswered' : 'support.tickets.statusOpen')}</span>
                    <time dateTime={ticket.createdAt}>{t('support.tickets.createdAt', { amount: formatDate(ticket.createdAt) })}</time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <article className="ticket-detail">
          {selectedTicket ? (
            <>
              <header className="ticket-detail__header">
                <div>
                  <h2>{selectedTicket.subject}</h2>
                  <p>{t(selectedTicket.status === 'answered' ? 'support.tickets.statusAnswered' : 'support.tickets.statusOpen')}</p>
                </div>
                <time dateTime={selectedTicket.createdAt}>{formatDate(selectedTicket.createdAt)}</time>
              </header>
              {selectedTicket.attachmentName ? (
                <p className="ticket-attachment">{t('support.tickets.attachment', { name: selectedTicket.attachmentName })}</p>
              ) : null}
              <TicketConversation ticket={selectedTicket} />
              <form className="ticket-reply" onSubmit={(event) => void submitReply(event)}>
                <label htmlFor="ticket-reply">{t('support.reply.messageLabel')}</label>
                <textarea
                  id="ticket-reply"
                  onChange={(event) => setReply(event.target.value)}
                  placeholder={t('support.reply.messagePlaceholder')}
                  value={reply}
                />
                {replyError ? <p className="field-error" role="alert">{replyError}</p> : null}
                <Button disabled={pending.includes('replyTicket')} type="submit">{t('support.reply.submit')}</Button>
              </form>
            </>
          ) : (
            <div className="ticket-detail__empty" />
          )}
        </article>
      </div>

      <Modal onClose={() => setCreateOpen(false)} open={createOpen} returnFocusRef={createTriggerRef} title={t('support.create.title')}>
        <form className="ticket-create-form" onSubmit={(event) => void submitTicket(event)}>
          <label htmlFor="ticket-subject">{t('support.create.subjectLabel')}</label>
          <input id="ticket-subject" onChange={(event) => setSubject(event.target.value)} placeholder={t('support.create.subjectPlaceholder')} value={subject} />
          {ticketErrors.subject ? <p className="field-error" role="alert">{ticketErrors.subject}</p> : null}
          <label htmlFor="ticket-message">{t('support.create.messageLabel')}</label>
          <textarea id="ticket-message" onChange={(event) => setMessage(event.target.value)} placeholder={t('support.create.messagePlaceholder')} value={message} />
          {ticketErrors.message ? <p className="field-error" role="alert">{ticketErrors.message}</p> : null}
          <label htmlFor="ticket-attachment">{t('support.create.attachmentLabel')}</label>
          <input id="ticket-attachment" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? '')} type="file" />
          <Button disabled={pending.includes('createTicket')} type="submit">{t('support.create.submit')}</Button>
        </form>
      </Modal>

      <ToastRegion messages={toast ? [toast] : []} onDismiss={() => setToast(null)} />
    </section>
  );
}
