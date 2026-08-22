import { useCallback, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import { useApp } from '../app/AppProvider';

/** Что человек получает в кабинете — показывается рядом с формой на широком экране. */
const CABINET_FEATURES = [
  'navigation.subscriptions',
  'auth.cabinetDevices',
  'navigation.balance',
  'navigation.referrals',
  'navigation.support',
] as const satisfies readonly MessageKey[];

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
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<MessageKey | null>(null);

  const navigateAfterLogin = useCallback(() => {
    navigate(returnPath ?? '/dashboard', { replace: true });
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
    <main className="auth-page">
      <header className="auth-page__bar">
        <Brand compact to="/" />
        <Link className="button button--ghost auth-page__back" to="/">
          <span className="auth-page__back-full">{t('auth.backToSite')}</span>
          <span className="auth-page__back-short">{t('auth.backToSiteShort')}</span>
        </Link>
      </header>

      <div className="auth-page__layout">
        <section className="auth-intro">
          <div className="auth-intro__heading">
            <h1>{t('auth.title')}</h1>
            <p>{t('auth.subtitle')}</p>
          </div>
          <div className="auth-intro__features">
            <span className="auth-intro__label">{t('auth.inCabinet')}</span>
            <ul>
              {CABINET_FEATURES.map((key) => <li key={key}>{t(key)}</li>)}
            </ul>
          </div>
        </section>

        <section className="auth-card">
          {!emailChallenge ? (
            <>
              <div className="auth-method">
                <div className="auth-method__head">
                  <h2>{t('auth.telegram.title')}</h2>
                  <span className="auth-method__mark" data-kind="primary">{t('auth.primaryMethod')}</span>
                </div>
                <Button
                  disabled={telegramPending}
                  onClick={() => void submitTelegram()}
                  variant="primary"
                >
                  {t(telegramPending ? 'auth.telegram.pending' : 'auth.telegram.continue')}
                </Button>
                <p className="auth-method__hint">{t('auth.telegram.hint')}</p>
              </div>

              <div aria-hidden="true" className="auth-divider"><span>{t('auth.or')}</span></div>

              <form className="auth-method" noValidate onSubmit={submitEmail}>
                <div className="auth-method__head">
                  <h2>{t('auth.email.label')}</h2>
                  <span className="auth-method__mark">{t('auth.backupMethod')}</span>
                </div>
                <label className="visually-hidden" htmlFor="auth-email">{t('auth.email.label')}</label>
                <input
                  aria-describedby={errorId}
                  id="auth-email"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder={t('auth.email.placeholder')}
                  type="email"
                  value={email}
                />
                <Button disabled={emailPending} type="submit" variant="ghost">
                  {t('auth.email.continue')}
                </Button>
                <p className="auth-method__hint">{t('auth.email.hint')}</p>
              </form>
            </>
          ) : (
            <form className="auth-method" noValidate onSubmit={submitCode}>
              <section aria-label={t('auth.email.localVerification.title')} className="auth-verification" role="region">
                <div className="auth-method__head">
                  <h2>{t('auth.email.localVerification.title')}</h2>
                </div>
                <p className="auth-method__hint">{t('auth.email.localVerification.description')}</p>
                <output aria-label={t('auth.accessibility.verificationCode')} className="auth-code">
                  {t('auth.email.localVerification.code', { amount: emailChallenge.code })}
                </output>
              </section>
              <label className="visually-hidden" htmlFor="auth-code">{t('auth.email.codeLabel')}</label>
              <input
                aria-describedby={errorId}
                autoComplete="one-time-code"
                id="auth-code"
                inputMode="numeric"
                onChange={(event) => setCode(event.currentTarget.value)}
                placeholder={t('auth.email.codePlaceholder')}
                value={code}
              />
              <Button disabled={codePending} type="submit" variant="primary">
                {t('auth.email.verify')}
              </Button>
            </form>
          )}

          {error ? <p className="field-error" id="auth-error" role="alert">{t(error)}</p> : null}
        </section>
      </div>
    </main>
  );
}
