import type { ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'default' | 'lg';

interface CardProps {
  children: ReactNode;
  /** Padding preset. Default: 'default'. */
  padding?: CardPadding;
  /** Additional className overrides. */
  className?: string;
}

const PADDING_MAP: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  default: 'px-6 py-5',
  lg: 'px-8 py-8',
};

/**
 * Canonical card atom.
 * Replaces 240+ ad-hoc `rounded-xl border border-border bg-background p{x,}-{N}` patterns.
 */
export default function Card({
  children,
  padding = 'default',
  className = '',
}: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-background ${PADDING_MAP[padding]} ${className}`}>
      {children}
    </div>
  );
}
