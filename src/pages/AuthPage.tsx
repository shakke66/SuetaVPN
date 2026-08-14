import { useCallback, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import { useApp } from '../app/AppProvider';

type AuthTab = 'login' | 'register';

function authErrorKey(code: string): MessageKey {
  switch (code) {
    case 'EMAIL_REQUIRED': return 'auth.validation.emailRequired';
    case 'EMAIL_INVALID': return 'auth.validation.emailInvalid';
    case 'CODE_REQUIRED': return 'auth.validation.codeRequired';
    case 'CODE_INVALID': return 'auth.validation.codeInvalid';
    case 'CODE_EXPIRED': return 'auth.validation.codeExpired';
    default: return 'auth.validation.codeWrong';
  }
}

export function AuthPage() {
  const {
    emailChallenge,
    loginTelegram,
    pending,
    returnPath,
    startEmail,
    state,
    verifyEmail,
  } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<MessageKey | null>(null);

  const navigateAfterLogin = useCallback(() => {
    const destination = returnPath ?? '/dashboard';
    navigate(destination, { replace: true });
  }, [navigate, returnPath]);

  if (state.session.active) {
    return <Navigate to={returnPath ?? '/dashboard'} replace />;
  }

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await startEmail(email);
    if (!result.ok) setError(authErrorKey(result.code));
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await verifyEmail(code);
    if (result.ok) navigateAfterLogin();
    else setError(authErrorKey(result.code));
  };

  const submitTelegram = async () => {
    setError(null);
    const result = await loginTelegram();
    if (result.ok) navigateAfterLogin();
  };

  const emailPending = pending.includes('startEmail');
  const codePending = pending.includes('verifyEmail');
  const telegramPending = pending.includes('loginTelegram');
  const errorId = error ? 'auth-error' : undefined;

  return (
    <main>
      <h1>{t('auth.title')}</h1>
      <p>{t('auth.subtitle')}</p>

      <div role="tablist" aria-label={t('auth.accessibility.loginMethods')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          onClick={() => setTab('login')}
        >
          {t('auth.tabs.login')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'register'}
          onClick={() => setTab('register')}
        >
          {t('auth.tabs.register')}
        </button>
      </div>

      <section aria-labelledby="telegram-title">
        <h2 id="telegram-title">{t('auth.telegram.title')}</h2>
        <button type="button" onClick={() => void submitTelegram()} disabled={telegramPending}>
          {t(telegramPending ? 'auth.telegram.pending' : 'auth.telegram.continue')}
        </button>
      </section>

      <form onSubmit={emailChallenge ? submitCode : submitEmail} noValidate>
        {!emailChallenge ? (
          <>
            <label htmlFor="auth-email">{t('auth.email.label')}</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              placeholder={t('auth.email.placeholder')}
              aria-describedby={errorId}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <button type="submit" disabled={emailPending}>{t('auth.email.continue')}</button>
          </>
        ) : (
          <>
            <section role="region" aria-label={t('auth.email.localVerification.title')}>
              <h2>{t('auth.email.localVerification.title')}</h2>
              <p>{t('auth.email.localVerification.description')}</p>
              <output aria-label={t('auth.accessibility.verificationCode')}>
                {t('auth.email.localVerification.code', { amount: emailChallenge.code })}
              </output>
            </section>
            <label htmlFor="auth-code">{t('auth.email.codeLabel')}</label>
            <input
              id="auth-code"
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t('auth.email.codePlaceholder')}
              aria-describedby={errorId}
              onChange={(event) => setCode(event.currentTarget.value)}
            />
            <button type="submit" disabled={codePending}>{t('auth.email.verify')}</button>
          </>
        )}
        {error ? <p id="auth-error" role="alert">{t(error)}</p> : null}
      </form>
    </main>
  );
}
