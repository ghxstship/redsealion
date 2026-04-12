'use client';

/**
 * TemplateActions — client-side action buttons for template cards.
 * Provides duplicate functionality (TPL-03).
 *
 * @module components/admin/templates/TemplateActions
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import Button from '@/components/ui/Button';

interface TemplateActionsProps {
  templateId: string;
}

export default function TemplateActions({ templateId }: TemplateActionsProps) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (duplicating) return;
    setDuplicating(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silent fail
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Button
      onClick={handleDuplicate}
      disabled={duplicating}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-secondary hover:text-foreground disabled:opacity-50"
      title="Duplicate template"
    >
      <Copy size={12} />
      {duplicating ? 'Duplicating…' : 'Duplicate'}
    </Button>
  );
}
