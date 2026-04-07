'use client';

import { useState, type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';

interface PageHeaderProps {
  /** Page title (h1). */
  title: string;
  /** Optional subtitle below the h1. */
  subtitle?: string;
  /** Label for the primary action button (e.g. "Add Client"). */
  actionLabel?: string;
  /** Render prop that receives (open, onClose, onComplete) for the modal. */
  renderModal?: (props: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
  }) => ReactNode;
  /** Called after the modal reports a successful creation. Defaults to router.refresh(). */
  onCreated?: () => void;
  /** Optional extra items rendered between title and action button. */
  children?: ReactNode;
}

/**
 * Canonical page header organism.
 *
 * Renders the standard admin page header: h1 + optional subtitle on the left,
 * primary action button on the right, and an optional modal.
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Equipment"
 *   subtitle="Manage your inventory"
 *   actionLabel="Add Equipment"
 *   renderModal={(props) => <EquipmentFormModal {...props} />}
 * />
 * ```
 */
export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  renderModal,
  onCreated,
  children,
}: PageHeaderProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {actionLabel && (
            <Button onClick={() => setShowModal(true)}>
              <IconPlus size={16} />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>

      {renderModal?.({
        open: showModal,
        onClose: () => setShowModal(false),
        onCreated: () => {
          setShowModal(false);
          onCreated?.();
        },
      })}
    </>
  );
}
