import type { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonAsButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type ButtonAsLinkProps = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; disabled?: boolean };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-foreground text-white hover:bg-foreground/90',
  secondary: 'border border-border bg-white text-foreground hover:bg-bg-secondary',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-text-muted hover:text-foreground hover:bg-bg-secondary',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  default: 'px-4 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
};

/**
 * Canonical Button atom.
 * Use variant + size to cover all button patterns across the platform.
 * Providing an href prop will render a Next.js Link instead.
 */
export default function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const commonClasses = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if ('href' in rest && rest.href) {
    if (disabled || loading) {
      return (
        <span className={`${commonClasses} opacity-50 cursor-not-allowed`} aria-disabled="true">
          {children}
        </span>
      );
    }
    return (
      <Link className={commonClasses} {...(rest as Omit<ButtonAsLinkProps, keyof ButtonBaseProps>)}>
        {children}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled || loading}
      className={commonClasses}
      {...(rest as Omit<ButtonAsButtonProps, keyof ButtonBaseProps>)}
    >
      {children}
    </button>
  );
}
