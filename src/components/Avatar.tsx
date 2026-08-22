import type { JSX } from 'react';
import type { TariffId } from '../domain/types';
import { Icon } from './Icon';

interface AvatarProps {
  /** Ссылка на картинку; пусто — покажем первую букву имени. */
  readonly avatar: string | null;
  readonly className?: string;
  readonly iconSize?: number;
  readonly name: string;
  readonly tariffId?: TariffId;
}

export function Avatar({ avatar, className, iconSize = 20, name, tariffId }: AvatarProps): JSX.Element {
  const initial = name.trim().charAt(0).toUpperCase();
  const classes = className ? `profile-avatar ${className}` : 'profile-avatar';

  if (avatar) {
    return <img alt="" className={`${classes} profile-avatar--image`} data-tariff={tariffId} src={avatar} />;
  }

  return (
    <span aria-hidden="true" className={classes} data-tariff={tariffId}>
      {initial || <Icon name="profile" size={iconSize} />}
    </span>
  );
}
