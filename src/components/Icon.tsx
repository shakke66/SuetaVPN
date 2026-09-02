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
  | 'support'
  | 'telegram';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> {
  name: IconName;
  size?: number;
}

function IconPath({ name }: { name: IconName }): JSX.Element {
  switch (name) {
    // Пять иконок навигации нарисованы парой слоёв: контур для покоя и залитый
    // силуэт для активного раздела. Силуэт это тот же контур, смещённый наружу
    // на половину штриха, поэтому при переключении глиф не меняет габарит.
    case 'dashboard':
      return (
        <>
          <g data-icon-layer="stroke">
            <path d="M4 17.2V10.6L12 3.8l8 6.8v6.6a2.8 2.8 0 0 1-2.8 2.8H6.8A2.8 2.8 0 0 1 4 17.2Z" />
          </g>
          <g data-icon-layer="fill" fill="currentColor" stroke="none">
            <path
              d="M12 2.5 21 10.1v7.1a3.8 3.8 0 0 1-3.8 3.8H6.8A3.8 3.8 0 0 1 3 17.2v-7.1ZM9.6 21v-3.2a2.4 2.4 0 0 1 4.8 0V21Z"
              fillRule="evenodd"
            />
          </g>
        </>
      );
    case 'subscriptions':
      return (
        <>
          <g data-icon-layer="stroke">
            <circle cx="8.6" cy="15.4" r="3.8" />
            <path d="M11.3 12.7 19.4 4.6m-3.8 3.8 2.1 2.1m-4.2 0 1.6 1.6" />
          </g>
          <g data-icon-layer="fill" fill="currentColor" stroke="none">
            <path
              d="M13.4 15.4a4.8 4.8 0 1 0-9.6 0 4.8 4.8 0 1 0 9.6 0Zm-4.8 1.9a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z"
              fillRule="evenodd"
            />
            <path d="M11.3 12.7 19.4 4.6m-3.8 3.8 2.1 2.1m-4.2 0 1.6 1.6" fill="none" stroke="currentColor" />
          </g>
        </>
      );
    case 'balance':
      return (
        <>
          <g data-icon-layer="stroke">
            <path d="M3.8 8.8A3.4 3.4 0 0 1 7.2 5.4h9.6a3.4 3.4 0 0 1 3.4 3.4v7.8a3.4 3.4 0 0 1-3.4 3.4H7.2a3.4 3.4 0 0 1-3.4-3.4Z" />
            <path d="M19.2 10.5h-2.6a2.2 2.2 0 0 0 0 4.4h2.6" />
          </g>
          <g data-icon-layer="fill" fill="currentColor" stroke="none">
            <path
              d="M2.8 8.8A4.4 4.4 0 0 1 7.2 4.4h9.6a4.4 4.4 0 0 1 4.4 4.4v7.8a4.4 4.4 0 0 1-4.4 4.4H7.2a4.4 4.4 0 0 1-4.4-4.4ZM22 11.5h-5.4a1.2 1.2 0 0 0 0 2.4H22Z"
              fillRule="evenodd"
            />
          </g>
        </>
      );
    case 'referral':
      return (
        <>
          <g data-icon-layer="stroke">
            <circle cx="6.8" cy="12" r="3" />
            <circle cx="17.4" cy="5.9" r="2.3" />
            <circle cx="17.4" cy="18.1" r="2.3" />
            <path d="m9.4 10.5 6-3.45m-6 6.45 6 3.45" />
          </g>
          <g data-icon-layer="fill" fill="currentColor" stroke="none">
            <circle cx="6.8" cy="12" r="4" />
            <circle cx="17.4" cy="5.9" r="3.3" />
            <circle cx="17.4" cy="18.1" r="3.3" />
            <path d="M6.8 12 17.4 5.9M6.8 12 17.4 18.1" fill="none" stroke="currentColor" />
          </g>
        </>
      );
    case 'support':
      return (
        <>
          <g data-icon-layer="stroke">
            <path d="M20 9.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 9.2v3.6a3.8 3.8 0 0 0 3.8 3.8h.6v3.6l4-3.6h3.8a3.8 3.8 0 0 0 3.8-3.8Z" />
          </g>
          <g data-icon-layer="fill" fill="currentColor" stroke="none">
            <path d="M7.8 4.4h8.4A4.8 4.8 0 0 1 21 9.2v3.6a4.8 4.8 0 0 1-4.8 4.8h-3.4l-5.4 3.9v-3.9H7.8A4.8 4.8 0 0 1 3 12.8V9.2A4.8 4.8 0 0 1 7.8 4.4Z" />
          </g>
        </>
      );
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
    case 'telegram':
      return <path d="M3 11.5 21 4l-3 16-6.2-4.6L9 19l-.4-4.2L18 7 7.8 13.2 3 11.5Z" fill="currentColor" stroke="none" />;
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
