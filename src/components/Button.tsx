import { forwardRef, type ButtonHTMLAttributes, type JSX } from 'react';

type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'utility';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', iconOnly = false, type = 'button', variant = 'ghost', ...props },
  ref,
): JSX.Element {
  const classes = [
    'button',
    `button--${variant}`,
    iconOnly ? 'button--icon' : '',
    className,
  ].filter(Boolean).join(' ');
  return <button ref={ref} className={classes} type={type} {...props} />;
});
