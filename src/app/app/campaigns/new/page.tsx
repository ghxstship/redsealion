'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormTextarea from '@/components/ui/FormTextarea';
import Checkbox from '@/components/ui/Checkbox';

import { RoleGate } from '@/components/shared/RoleGate';
export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
    target_all_clients: true,
    target_tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.subject) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          subject: form.subject,
          body_html: form.body_html || null,
          target_all_clients: form.target_all_clients,
          target_tags: form.target_tags ? form.target_tags.split(',').map((t) => t.trim()) : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create campaign.');
      }

      router.push('/app/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGate>
    <div className="max-w-3xl">
<PageHeader
        title="New Campaign"
        subtitle="Create an email campaign to reach your clients."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Campaign Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FormLabel htmlFor="c-name">Name</FormLabel>
              <FormInput id="c-name" name="name" required value={form.name} onChange={handleChange}
                placeholder="Q2 Product Announcement" />
            </div>
            <div>
              <FormLabel htmlFor="c-subject">Subject Line</FormLabel>
              <FormInput id="c-subject" name="subject" required value={form.subject} onChange={handleChange}
                placeholder="Exciting updates from our team" />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Email Body</h2>
          <FormTextarea
            name="body_html"
            value={form.body_html}
            onChange={handleChange}
            rows={10}
            placeholder="Compose your email body (HTML supported)…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-mono"
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Targeting</h2>
          <Checkbox
              id="c-all-clients"
              checked={form.target_all_clients}
              onChange={(e) => setForm((p) => ({ ...p, target_all_clients: (e.target as HTMLInputElement).checked }))}
              label="Send to all clients"
              size="md"
            />
          {!form.target_all_clients && (
            <div>
              <FormLabel htmlFor="c-tags">Filter by Tags (comma-separated)</FormLabel>
              <FormInput id="c-tags" name="target_tags" value={form.target_tags} onChange={handleChange}
                placeholder="vip, returning, enterprise" />
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !form.name || !form.subject}>
            {saving ? 'Creating…' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </div>
  </RoleGate>
  );
}
