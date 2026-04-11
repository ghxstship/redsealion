'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import { PROJECT_STATUSES, PROJECT_VISIBILITY } from '@/lib/constants/project';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      status: formData.get('status'),
      visibility: formData.get('visibility'),
      venue_name: formData.get('venue_name') || undefined,
      starts_at: formData.get('starts_at') || undefined,
      ends_at: formData.get('ends_at') || undefined,
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to create project.');
        setSaving(false);
        return;
      }

      const data = await res.json();
      const project = data.project ?? data.data;
      router.push(project?.id ? `/app/projects/${project.id}` : '/app/projects');
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="projects">
      <div className="mb-4">
        <Link href="/app/projects" className="text-sm text-text-muted hover:text-foreground mb-2 inline-block">
          &larr; Back to Projects
        </Link>
        <PageHeader title="New Project" subtitle="Create a new project to organize work, events, and budgets." />
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <div>
              <FormLabel>Project Name *</FormLabel>
              <FormInput name="name" required placeholder="e.g., SXSW 2026 Activation" />
            </div>
            <div>
              <FormLabel>Description</FormLabel>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief project description..."
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Status</FormLabel>
                <FormSelect name="status" defaultValue="planning">
                  {PROJECT_STATUSES.filter(s => !['archived', 'in_progress'].includes(s.value)).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <FormLabel>Visibility</FormLabel>
                <FormSelect name="visibility" defaultValue="internal">
                  {PROJECT_VISIBILITY.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </FormSelect>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <div>
              <FormLabel>Venue Name</FormLabel>
              <FormInput name="venue_name" placeholder="e.g., Austin Convention Center" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Start Date</FormLabel>
                <FormInput name="starts_at" type="date" />
              </div>
              <div>
                <FormLabel>End Date</FormLabel>
                <FormInput name="ends_at" type="date" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push('/app/projects')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </TierGate>
  );
}
