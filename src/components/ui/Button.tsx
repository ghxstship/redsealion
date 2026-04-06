import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

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
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
