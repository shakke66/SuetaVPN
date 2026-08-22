import { useEffect, useRef, useState, type FormEvent, type JSX, type RefObject } from 'react';
import { useApp } from '../app/AppProvider';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './Button';
import { Modal } from './Modal';

/** Столько секунд кнопка повторной отправки ждёт, прежде чем снова стать доступной. */
const RESEND_SECONDS = 45;

function errorKey(code: string): MessageKey {
  switch (code) {
    case 'EMAIL_REQUIRED': return 'auth.validation.emailRequired';
    case 'EMAIL_INVALID': return 'auth.validation.emailInvalid';
    case 'CODE_REQUIRED': return 'auth.validation.codeRequired';
    case 'CODE_INVALID': return 'auth.validation.codeInvalid';
    case 'CODE_EXPIRED': return 'auth.validation.codeExpired';
    default: return 'auth.validation.codeWrong';
  }
}

interface EmailDialogProps {
  onClose: () => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function EmailDialog({ onClose, open, returnFocusRef }: EmailDialogProps): JSX.Element {
  const { emailChallenge, pending, startEmail, verifyEmail } = useApp();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<MessageKey | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const codeSent = step === 'code' && emailChallenge !== null;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setCode('');
      setError(null);
      setSeconds(0);
      setStep('email');
    }
  }, [open]);

  useEffect(() => {
    if (seconds <= 0) return;
    timerRef.current = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [seconds]);

  const requestCode = async (value: string) => {
    setError(null);
    const result = await startEmail(value);
    if (result.ok) {
      setStep('code');
      setCode('');
      setSeconds(RESEND_SECONDS);
    } else {
      setError(errorKey(result.code));
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    void requestCode(email);
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await verifyEmail(code);
    if (result.ok) onClose();
    else setError(errorKey(result.code));
  };

  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const errorId = error ? 'email-dialog-error' : undefined;

  return (
    <Modal
      onClose={onClose}
      open={open}
      returnFocusRef={returnFocusRef}
      title={t(codeSent ? 'profile.emailDialog.confirmTitle' : 'profile.emailDialog.title')}
    >
      {!codeSent ? (
        <form className="email-dialog" noValidate onSubmit={submitEmail}>
          <p>{t('profile.emailDialog.description')}</p>
          <div className="email-dialog__field">
            <label htmlFor="profile-email">{t('auth.email.label')}</label>
            <input
              aria-describedby={errorId}
              id="profile-email"
              onChange={(event) => { setEmail(event.currentTarget.value); setError(null); }}
              placeholder={t('auth.email.placeholder')}
              type="email"
              value={email}
            />
          </div>
          {error ? <p className="field-error" id="email-dialog-error" role="alert">{t(error)}</p> : null}
          <div className="email-dialog__actions">
            <Button disabled={pending.includes('startEmail')} type="submit" variant="primary">
              {t('auth.email.continue')}
            </Button>
            <Button onClick={onClose} variant="ghost">{t('common.actions.cancel')}</Button>
          </div>
        </form>
      ) : (
        <form className="email-dialog" noValidate onSubmit={submitCode}>
          <p className="email-dialog__sent">
            {t('profile.emailDialog.sentTo', { email: emailChallenge.email })}
            <button className="email-dialog__change" onClick={() => setStep('email')} type="button">
              {t('profile.emailDialog.change')}
            </button>
          </p>

          {/* Писем сервис не отправляет: код выдаётся здесь же, как на экране входа. */}
          <section aria-label={t('auth.email.localVerification.title')} className="auth-verification" role="region">
            <p className="auth-method__hint">{t('profile.emailDialog.codeHint')}</p>
            <output aria-label={t('auth.accessibility.verificationCode')} className="auth-code">
              {t('auth.email.localVerification.code', { amount: emailChallenge.code })}
            </output>
          </section>

          <div className="email-dialog__field">
            <label htmlFor="profile-email-code">{t('auth.email.codeLabel')}</label>
            <input
              aria-describedby={errorId}
              autoComplete="one-time-code"
              className="email-dialog__code"
              id="profile-email-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => { setCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
              value={code}
            />
          </div>
          {error ? <p className="field-error" id="email-dialog-error" role="alert">{t(error)}</p> : null}

          <div className="email-dialog__actions">
            <Button disabled={pending.includes('verifyEmail')} type="submit" variant="primary">
              {t('auth.email.verify')}
            </Button>
            <Button
              disabled={seconds > 0 || pending.includes('startEmail')}
              onClick={() => void requestCode(emailChallenge.email)}
              variant="ghost"
            >
              {seconds > 0
                ? t('profile.emailDialog.resendIn', { time: countdown })
                : t('profile.emailDialog.resend')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
