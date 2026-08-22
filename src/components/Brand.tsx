import type { JSX } from 'react';
import { Link } from 'react-router';
import logo from '../assets/suetavpn-logo.png';
import { useI18n } from '../i18n/I18nProvider';

interface BrandProps {
  compact?: boolean;
  to?: string;
}

export function Brand({ compact = false, to = '/dashboard' }: BrandProps): JSX.Element {
  const { t } = useI18n();
  return (
    <Link className={compact ? 'brand brand--compact' : 'brand'} to={to}>
      <img className="brand__logo" src={logo} alt="" />
      <span>{t('app.name')}</span>
    </Link>
  );
}
