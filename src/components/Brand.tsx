import type { JSX } from 'react';
import { Link } from 'react-router';
import logo from '../assets/suetavpn-logo.jpg';
import { useI18n } from '../i18n/I18nProvider';

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps): JSX.Element {
  const { t } = useI18n();
  return (
    <Link className={compact ? 'brand brand--compact' : 'brand'} to="/dashboard">
      <img className="brand__logo" src={logo} alt="" />
      <span>{t('app.name')}</span>
    </Link>
  );
}
