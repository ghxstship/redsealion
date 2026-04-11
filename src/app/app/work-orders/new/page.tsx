'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Alert from '@/components/ui/Alert';

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      priority: formData.get('priority'),
      location_name: formData.get('location_name') || undefined,
      location_address: formData.get('location_address') || undefined,
      scheduled_start: formData.get('scheduled_start') || undefined,
      scheduled_end: formData.get('scheduled_end') || undefined,
    };

    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to create work order.');
        setSaving(false);
        return;
      }

      const { work_order } = await res.json();
      router.push(`/app/work-orders/${work_order.id}`);
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="work_orders">
      <div className="mb-4">
        <Link href="/app/work-orders" className="text-sm text-text-muted hover:text-foreground mb-2 inline-block">
          &larr; Back to Work Orders
        </Link>
        <PageHeader title="New Work Order" subtitle="Create a new work order for field operations." />
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <div>
              <FormLabel>Title *</FormLabel>
              <FormInput name="title" required placeholder="e.g., Stage build at Convention Center" />
            </div>
            <div>
              <FormLabel>Description</FormLabel>
              <textarea
                name="description"
                rows={3}
                placeholder="Work order details and instructions..."
                className="w-full flex rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Priority</FormLabel>
                <FormSelect name="priority" defaultValue="medium">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </FormSelect>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Location</h3>
            <div>
              <FormLabel>Location Name</FormLabel>
              <FormInput name="location_name" placeholder="e.g., Convention Center Hall B" />
            </div>
            <div>
              <FormLabel>Address</FormLabel>
              <FormInput name="location_address" placeholder="123 Main St, City, State" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Scheduled Start</FormLabel>
                <FormInput name="scheduled_start" type="datetime-local" />
              </div>
              <div>
                <FormLabel>Scheduled End</FormLabel>
                <FormInput name="scheduled_end" type="datetime-local" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push('/app/work-orders')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Work Order'}
            </Button>
          </div>
        </form>
      </div>
    </TierGate>
  );
}
