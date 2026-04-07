'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@/components/ui/Icons';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Width class: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'. Defaults to 'lg'. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Override z-index (e.g. z-[60] for stacked modals). Defaults to z-50. */
  zIndex?: string;
  /** If true, header uses border-b with its own padding (px-5 py-4) and children receive no padding from shell.
   *  Use for longer modals where the form body scrolls independently. Defaults to false (p-6 flat layout). */
  sectioned?: boolean;
  /** Optional className override for the panel container */
  className?: string;
  children: ReactNode;
}

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

/**
 * Canonical modal shell organism.
 * Provides backdrop, panel, header with title + close button, and animation.
 * Content is rendered via children.
 */
export default function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  size = 'lg',
  zIndex = 'z-50',
  sectioned = false,
  className = '',
  children,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const panelPadding = sectioned ? '' : 'p-6';
  const headerClass = sectioned
    ? 'flex items-center justify-between px-5 py-4 border-b border-border'
    : 'flex items-center justify-between mb-6';

  const modalContent = (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center overflow-y-auto p-4`}>
      <div className="fixed inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title" 
        className={`relative w-full ${SIZE_MAP[size]} rounded-xl border border-border bg-white ${panelPadding} shadow-xl animate-modal-content my-auto ${className}`}
      >
        <div className={headerClass}>
          <div>
            <h2 id="modal-title" className={`${sectioned ? 'text-base' : 'text-lg'} font-semibold text-foreground`}>{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close modal" className="text-text-muted hover:text-foreground transition-colors">
            <IconX aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
