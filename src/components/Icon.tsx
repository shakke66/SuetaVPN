import type { JSX, SVGProps } from 'react';

export type IconName =
  | 'balance'
  | 'bell'
  | 'chevron-right'
  | 'close'
  | 'dashboard'
  | 'globe'
  | 'info'
  | 'logout'
  | 'menu'
  | 'moon'
  | 'profile'
  | 'referral'
  | 'subscriptions'
  | 'sun'
  | 'support';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> {
  name: IconName;
  size?: number;
}

function IconPath({ name }: { name: IconName }): JSX.Element {
  switch (name) {
    case 'dashboard':
      return <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 10v10h13V10M9 20v-6h6v6" /></>;
    case 'subscriptions':
      return <><rect x="3.5" y="5" width="17" height="14" rx="3" /><path d="M8 3v4m8-4v4M3.5 10h17" /></>;
    case 'balance':
      return <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 9h16m-5 4h5" /><circle cx="16.5" cy="14" r=".5" fill="currentColor" stroke="none" /></>;
    case 'referral':
      return <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20a5.5 5.5 0 0 1 11 0m.5-5.5a4.5 4.5 0 0 1 7.5 3.4" /></>;
    case 'support':
      return <><path d="M4 13a8 8 0 0 1 16 0" /><path d="M4 13v3a2 2 0 0 0 2 2h2v-6H4m16 1v3a2 2 0 0 1-2 2h-2v-6h4m-4 7c0 1.1-.9 2-2 2h-2" /></>;
    case 'info':
      return <><circle cx="12" cy="12" r="9" /><path d="M12 10v6m0-9h.01" /></>;
    case 'profile':
      return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>;
    case 'sun':
      return <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>;
    case 'moon':
      return <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z" />;
    case 'bell':
      return <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>;
    case 'menu':
      return <path d="M4 7h16M4 12h16M4 17h16" />;
    case 'close':
      return <path d="m6 6 12 12M18 6 6 18" />;
    case 'logout':
      return <><path d="M10 5H5v14h5m4-4 4-3-4-3m4 3H9" /></>;
    case 'globe':
      return <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z" /></>;
    case 'chevron-right':
      return <path d="m9 5 7 7-7 7" />;
  }
}

export function Icon({ name, size = 20, ...props }: IconProps): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <IconPath name={name} />
    </svg>
  );
}
