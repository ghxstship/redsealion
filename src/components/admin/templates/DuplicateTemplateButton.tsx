'use client';

/**
 * DuplicateTemplateButton — clones a phase template via the API.
 *
 * Fetches the template detail, then POSTs a new template with
 * the same phases and description under a "(Copy)" name suffix.
 *
 * @module components/admin/templates/DuplicateTemplateButton
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  templateId: string;
  templateName: string;
}

export default function DuplicateTemplateButton({ templateId, templateName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (loading) return;
    setLoading(true);
    try {
      // Fetch the source template
      const detailRes = await fetch(`/api/templates/${templateId}`);
      if (!detailRes.ok) throw new Error('Failed to load template');
      const { template } = await detailRes.json();

      // Create a copy
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${templateName} (Copy)`,
          description: template.description ?? '',
          phases: template.phases ?? [],
        }),
      });

      if (!res.ok) throw new Error('Failed to duplicate template');
      router.refresh();
    } catch {
      // Silent fail — could add toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleDuplicate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-foreground disabled:opacity-50"
      title="Duplicate template"
    >
      <Copy size={12} />
      {loading ? 'Duplicating…' : 'Duplicate'}
    </Button>
  );
}
