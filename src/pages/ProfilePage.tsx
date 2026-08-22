import { useRef, useState, type ChangeEvent, type JSX } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApp } from '../app/AppProvider';
import { Avatar } from '../components/Avatar';
import { AvatarFileError, readAvatarFile } from '../components/avatarFile';
import { Button } from '../components/Button';
import { EmailDialog } from '../components/EmailDialog';
import { Icon } from '../components/Icon';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import type { Locale } from '../domain/types';

const LOCALES = [
  { code: 'RU', locale: 'ru' },
  { code: 'EN', locale: 'en' },
] as const satisfies readonly { code: string; locale: Locale }[];

export function ProfilePage(): JSX.Element {
  const { logout, setAvatar, setLocale, setReturnPath, setTheme, state, telegramMiniApp } = useApp();
  const { formatDate, formatMoney, locale, t } = useI18n();
  const navigate = useNavigate();
  const emailButtonRef = useRef<HTMLButtonElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [avatarError, setAvatarError] = useState<MessageKey | null>(null);

  const { profile, subscription } = state;
  const copy = subscription?.tariffId === 'elite' ? 'elite' : 'base';
  const dark = state.preferences.theme === 'dark';

  const chooseAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // Один и тот же файл должен выбираться повторно, поэтому поле очищаем сразу.
    event.currentTarget.value = '';
    if (!file) return;

    setAvatarError(null);
    try {
      await setAvatar(await readAvatarFile(file));
    } catch (error) {
      const reason = error instanceof AvatarFileError ? error.reason : 'decode';
      setAvatarError(`profile.avatar.errors.${reason}` as MessageKey);
    }
  };

  const tiles = [
    {
      hint: t('profile.tiles.topUp'),
      href: '/balance',
      key: 'balance',
      label: t('navigation.balance'),
      value: formatMoney(state.wallet.balance),
    },
    {
      hint: subscription
        ? `${subscription.daysLeft} ${t('subscriptions.daysUnit')}`
        : t('subscriptions.choose'),
      href: '/subscriptions',
      key: 'plan',
      label: t('navigation.subscriptions'),
      value: subscription ? t(`tariffs.${copy}.name`) : '—',
    },
    {
      hint: t('profile.tiles.manage'),
      href: '/subscriptions',
      key: 'devices',
      label: t('subscriptions.devicesTitle'),
      value: subscription ? `${subscription.devicesUsed}/${subscription.devicesLimit}` : '—',
    },
  ];

  const signOut = async () => {
    setReturnPath(null);
    navigate('/', { replace: true });
    await logout();
  };

  return (
    <section className="profile-page">
      <div className="page-heading"><h1>{t('profile.title')}</h1></div>

      <div className="profile-layout">
        <div className="profile-column">
          <section aria-labelledby="profile-account-title" className="subscription-card profile-account">
            <h2 id="profile-account-title">{t('profile.account')}</h2>
            <div className="profile-account__identity">
              <Avatar
                avatar={profile.avatar}
                className="profile-avatar--large"
                iconSize={24}
                name={profile.name}
                tariffId={subscription?.tariffId}
              />
              <span>
                <strong>{profile.name}</strong>
                <span>{profile.username}</span>
              </span>
            </div>

            <div className="profile-avatar-actions">
              <input
                ref={avatarInputRef}
                accept="image/*"
                aria-label={t('profile.avatar.choose')}
                className="visually-hidden"
                id="profile-avatar-file"
                onChange={(event) => void chooseAvatar(event)}
                type="file"
              />
              <Button onClick={() => avatarInputRef.current?.click()} variant="ghost">
                {t(profile.avatar ? 'profile.avatar.change' : 'profile.avatar.upload')}
              </Button>
              {profile.avatar ? (
                <Button onClick={() => { setAvatarError(null); void setAvatar(null); }} variant="utility">
                  {t('profile.avatar.remove')}
                </Button>
              ) : null}
            </div>
            {avatarError ? <p className="field-error" role="alert">{t(avatarError)}</p> : null}
            <dl className="profile-facts">
              <div>
                <dt>{t('profile.role')}</dt>
                <dd>{profile.role}</dd>
              </div>
              <div>
                <dt>{t('profile.since')}</dt>
                <dd>{formatDate(profile.registeredAt)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="profile-signin-title" className="subscription-card profile-signin">
            <h2 id="profile-signin-title">{t('profile.signIn.title')}</h2>

            <div className="profile-method">
              <span aria-hidden="true" className="profile-method__mark profile-method__mark--telegram">
                <Icon name="telegram" size={18} />
              </span>
              <span className="profile-method__text">
                <strong>{t('profile.signIn.telegram')}</strong>
                <span>{t('profile.signIn.telegramHint')}</span>
              </span>
              <span className="status-badge">{t('profile.signIn.connected')}</span>
            </div>

            <div className="profile-method">
              <span aria-hidden="true" className="profile-method__mark">@</span>
              <span className="profile-method__text">
                <strong>{t('profile.email')}</strong>
                <span data-empty={profile.email ? undefined : 'true'}>
                  {profile.email || t('profile.emailMissing')}
                </span>
              </span>
              {profile.email && profile.emailVerified ? (
                <span className="status-badge">{t('profile.signIn.verified')}</span>
              ) : (
                <>
                  {profile.email ? (
                    <span className="profile-method__badge">{t('profile.signIn.unverified')}</span>
                  ) : null}
                  <Button
                    ref={emailButtonRef}
                    onClick={() => setEmailDialogOpen(true)}
                    variant="ghost"
                  >
                    {t(profile.email ? 'profile.signIn.confirmEmail' : 'profile.signIn.addEmail')}
                  </Button>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="profile-column">
          <div className="profile-tiles">
            {tiles.map((tile) => (
              <Link
                aria-label={`${tile.label}: ${tile.value}`}
                className="profile-tile"
                key={tile.key}
                to={tile.href}
              >
                <span className="profile-tile__label">{tile.label}</span>
                <strong className="profile-tile__value">{tile.value}</strong>
                <span className="profile-tile__hint">{tile.hint}</span>
              </Link>
            ))}
          </div>

          <section aria-labelledby="profile-settings-title" className="subscription-card profile-settings">
            <h2 id="profile-settings-title">{t('profile.settings.title')}</h2>

            <div className="profile-setting">
              <span className="profile-setting__text">
                <strong>{t('profile.settings.darkTheme')}</strong>
                <span>{t(dark ? 'profile.settings.on' : 'profile.settings.off')}</span>
              </span>
              <button
                aria-checked={dark}
                aria-label={t('profile.settings.darkTheme')}
                className="auto-renew__switch"
                onClick={() => void setTheme(dark ? 'light' : 'dark')}
                role="switch"
                type="button"
              >
                <span aria-hidden="true" className="auto-renew__knob" />
              </button>
            </div>

            <div className="profile-setting">
              <span className="profile-setting__text">
                <strong>{t('profile.settings.language')}</strong>
                <span>{t(locale === 'ru' ? 'shell.language.russian' : 'shell.language.english')}</span>
              </span>
              <div aria-label={t('profile.settings.language')} className="profile-locales" role="radiogroup">
                {LOCALES.map((option) => (
                  <button
                    aria-checked={option.locale === locale}
                    className="profile-locale"
                    data-selected={option.locale === locale}
                    key={option.locale}
                    onClick={() => void setLocale(option.locale)}
                    role="radio"
                    type="button"
                  >
                    {option.code}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="profile-referral-title" className="subscription-card profile-referral">
            <div className="profile-referral__head">
              <h2 id="profile-referral-title">{t('referrals.title')}</h2>
              <span>
                {t('profile.referral.invited', {
                  active: state.referral.active,
                  amount: state.referral.invited,
                })}
              </span>
            </div>
            <div className="profile-referral__body">
              <span className="profile-referral__earned">
                <span>{t('referrals.stats.earned')}</span>
                <strong>{formatMoney(state.referral.earned)}</strong>
              </span>
              <Link className="button button--ghost" to="/referral">{t('profile.referral.open')}</Link>
            </div>
          </section>

          {!telegramMiniApp ? (
            <Button className="profile-signout" onClick={() => void signOut()} variant="danger">
              {t('auth.actions.logout')}
            </Button>
          ) : null}
        </div>
      </div>

      <EmailDialog
        onClose={() => setEmailDialogOpen(false)}
        open={emailDialogOpen}
        returnFocusRef={emailButtonRef}
      />
    </section>
  );
}
