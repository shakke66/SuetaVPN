import { useEffect, useId, useRef, useState, type JSX } from 'react';
import { Link } from 'react-router';
import { useApp } from '../app/AppProvider';
import { useI18n } from '../i18n/I18nProvider';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Icon } from './Icon';

interface ProfileMenuProps {
  /** Не передан — приложение открыто в Telegram Mini App, где выхода нет. */
  onSignOut?: () => void;
}

export function ProfileMenu({ onSignOut }: ProfileMenuProps): JSX.Element {
  const { state } = useApp();
  const { formatMoney, t } = useI18n();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const closeOnPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const { avatar, name, username, email } = state.profile;
  const subscription = state.subscription;
  const copy = subscription?.tariffId === 'elite' ? 'elite' : 'base';

  return (
    <div
      ref={rootRef}
      className="language-menu profile-menu"
      data-open={open ? 'true' : 'false'}
      data-tariff={subscription?.tariffId}
    >
      <Button
        ref={triggerRef}
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('navigation.profile')}
        className="language-menu__trigger profile-menu__trigger"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        variant="utility"
      >
        <Avatar
          avatar={avatar}
          className="profile-avatar--trigger"
          iconSize={16}
          name={name}
          tariffId={subscription?.tariffId}
        />
        <span className="profile-menu__name">{name || t('navigation.profile')}</span>
        <Icon aria-hidden="true" className="language-menu__chevron" name="chevron-right" size={15} />
      </Button>

      <div
        id={menuId}
        aria-hidden={open ? undefined : 'true'}
        className="language-menu__popover profile-menu__popover"
        inert={!open}
        role="menu"
      >
        <div className="profile-menu__head">
          <Avatar avatar={avatar} name={name} tariffId={subscription?.tariffId} />
          <span className="profile-menu__identity">
            <strong>{name}</strong>
            <span>{username}</span>
          </span>
        </div>

        <p className="profile-menu__email" data-empty={email ? undefined : 'true'}>
          {email || t('profile.emailMissing')}
        </p>

        <div className="profile-menu__summary">
          {subscription ? (
            <span className="profile-menu__row">
              <span className="subscription-card__plan" data-tariff={subscription.tariffId}>
                {t(`tariffs.${copy}.name`)}
              </span>
              <span>
                {subscription.daysLeft} {t('subscriptions.daysUnit')} {t('subscriptions.daysLeftCaption')}
              </span>
            </span>
          ) : (
            <span className="profile-menu__row">
              <span>{t('subscriptions.empty')}</span>
            </span>
          )}
          <span className="profile-menu__row">
            <span>{t('balance.current')}</span>
            <strong>{formatMoney(state.wallet.balance)}</strong>
          </span>
        </div>

        <span aria-hidden="true" className="profile-menu__divider" />

        <Link
          ref={firstItemRef}
          className="language-menu__option"
          onClick={() => setOpen(false)}
          role="menuitem"
          to="/profile"
        >
          <Icon name="profile" />
          <span>{t('navigation.profile')}</span>
        </Link>
        <Link
          className="language-menu__option"
          onClick={() => setOpen(false)}
          role="menuitem"
          to="/balance"
        >
          <Icon name="balance" />
          <span>{t('navigation.balance')}</span>
        </Link>

        {onSignOut ? (
          <>
            <span aria-hidden="true" className="profile-menu__divider" />
            <button
              className="language-menu__option profile-menu__signout"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              role="menuitem"
              type="button"
            >
              <Icon name="logout" />
              <span>{t('auth.actions.logout')}</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
