'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import Button from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const btnVariant = variant === 'danger' ? 'danger' : 'primary';

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onCancel} title={title} size="sm" zIndex="z-[60]">
      <p className="text-sm text-text-secondary leading-relaxed">{message}</p>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={btnVariant} onClick={handleConfirm} loading={loading}>
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </div>
    </ModalShell>
  );
}
