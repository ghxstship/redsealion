'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface TemplateEditClientProps {
  template: {
    id: string;
    name: string;
    description: string | null;
    is_default: boolean;
    phases: string[];
  };
}

export default function TemplateEditClient({ template }: TemplateEditClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<string[]>(template.phases);
  const [newPhase, setNewPhase] = useState('');

  function addPhase() {
    const trimmed = newPhase.trim();
    if (trimmed && !phases.includes(trimmed)) {
      setPhases([...phases, trimmed]);
      setNewPhase('');
    }
  }

  function removePhase(idx: number) {
    setPhases(phases.filter((_, i) => i !== idx));
  }

  function movePhase(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= phases.length) return;
    const next = [...phases];
    [next[idx], next[target]] = [next[target], next[idx]];
    setPhases(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('phase_templates')
        .update({
          name: formData.get('name') as string,
          description: (formData.get('description') as string) || null,
          is_default: formData.get('is_default') === 'on',
          phases,
        })
        .eq('id', template.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      router.push('/app/templates');
      router.refresh();
    } catch {
      setError('Network error.');
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <Link href="/app/templates" className="text-sm text-text-muted hover:text-foreground mb-2 inline-block">
          &larr; Back to Templates
        </Link>
        <PageHeader title="Edit Template" subtitle={template.name} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <div>
              <FormLabel>Template Name *</FormLabel>
              <FormInput name="name" required defaultValue={template.name} />
            </div>
            <div>
              <FormLabel>Description</FormLabel>
              <FormInput name="description" defaultValue={template.description ?? ''} placeholder="Describe this template" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_default"
                id="is_default"
                defaultChecked={template.is_default}
                className="rounded border-border"
              />
              <label htmlFor="is_default" className="text-sm text-foreground">Set as default template</label>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Phases</h3>

            <div className="space-y-2">
              {phases.map((phase, idx) => (
                <div key={`${phase}-${idx}`} className="flex items-center gap-2 bg-bg-secondary rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-text-muted w-6">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="text-sm text-foreground flex-1">{phase}</span>
                  <button type="button" onClick={() => movePhase(idx, -1)} disabled={idx === 0} className="text-xs text-text-muted hover:text-foreground disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => movePhase(idx, 1)} disabled={idx === phases.length - 1} className="text-xs text-text-muted hover:text-foreground disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removePhase(idx)} className="text-xs text-red-500 hover:text-red-700">×</button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <FormInput
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
                placeholder="Add a phase..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhase(); } }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={addPhase}>Add</Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push('/app/templates')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
