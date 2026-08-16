import type { JSX } from 'react';
import { useApp } from '../app/AppProvider';
import logo from '../assets/suetavpn-logo.jpg';
import { useI18n } from '../i18n/I18nProvider';

export function ProfilePage(): JSX.Element {
  const { state } = useApp();
  const { formatDate, t } = useI18n();
  return (
    <section className="profile-page">
      <div className="page-heading"><h1>{t('profile.title')}</h1></div>
      <article className="profile-card">
        <header className="profile-card__header">
          <img alt="SuetaVPN" src={logo} />
          <div>
            <h2>{state.profile.name}</h2>
            <p>{state.profile.username}</p>
          </div>
        </header>
        <dl className="profile-details">
          <div><dt>{t('profile.email')}</dt><dd>{state.profile.email || t('profile.emailMissing')}</dd></div>
          <div><dt>{t('profile.registeredAt')}</dt><dd>{formatDate(state.profile.registeredAt)}</dd></div>
        </dl>
      </article>
    </section>
  );
}
