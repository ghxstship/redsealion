'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';

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
    <div className="max-w-3xl">
<PageHeader
        title="New Campaign"
        subtitle="Create an email campaign to reach your clients."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Campaign Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="c-name" className="block text-xs font-medium text-text-secondary mb-1">Name</label>
              <input id="c-name" name="name" required value={form.name} onChange={handleChange}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground" placeholder="Q2 Product Announcement" />
            </div>
            <div>
              <label htmlFor="c-subject" className="block text-xs font-medium text-text-secondary mb-1">Subject Line</label>
              <input id="c-subject" name="subject" required value={form.subject} onChange={handleChange}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground" placeholder="Exciting updates from our team" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Email Body</h2>
          <textarea
            name="body_html"
            value={form.body_html}
            onChange={handleChange}
            rows={10}
            placeholder="Compose your email body (HTML supported)…"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground font-mono"
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Targeting</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.target_all_clients}
              onChange={(e) => setForm((p) => ({ ...p, target_all_clients: e.target.checked }))}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Send to all clients</span>
          </label>
          {!form.target_all_clients && (
            <div>
              <label htmlFor="c-tags" className="block text-xs font-medium text-text-secondary mb-1">Filter by Tags (comma-separated)</label>
              <input id="c-tags" name="target_tags" value={form.target_tags} onChange={handleChange}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground" placeholder="vip, returning, enterprise" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.name || !form.subject}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}
