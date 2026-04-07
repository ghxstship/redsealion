'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import StatusBadge from '@/components/ui/StatusBadge';
import FormInput from '@/components/ui/FormInput';
import { formatLabel } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';

interface CountLine {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_barcode: string | null;
  asset_serial: string | null;
  asset_category: string;
  asset_condition: string;
  expected_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  condition_observed: string | null;
  notes: string | null;
}

interface CountWorksheetProps {
  count: {
    id: string;
    count_type: string;
    status: string;
    location: string | null;
    started_at: string | null;
    completed_at: string | null;
  };
  lines: CountLine[];
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function CountWorksheetClient({ count, lines: initialLines }: CountWorksheetProps) {
  const router = useRouter();
  const [lines, setLines] = useState(initialLines);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const updateLine = (lineId: string, field: string, value: unknown) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, [field]: value } : l,
      ),
    );
    setSaved(false);
  };

  const countedCount = lines.filter((l) => l.counted_quantity != null).length;
  const totalVariance = lines.reduce((sum, l) => {
    if (l.counted_quantity == null) return sum;
    return sum + Math.abs((l.counted_quantity ?? 0) - l.expected_quantity);
  }, 0);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const linesToSave = lines
        .filter((l) => l.counted_quantity != null)
        .map((l) => ({
          id: l.id,
          counted_quantity: l.counted_quantity!,
          condition_observed: l.condition_observed || undefined,
          notes: l.notes || undefined,
        }));

      const res = await fetch(`/api/warehouse/counts/${count.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: linesToSave }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    await fetch(`/api/warehouse/counts/${count.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    refresh();
  }

  const isEditable = count.status !== 'completed' && count.status !== 'cancelled';

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
<PageHeader title={<>{formatLabel(count.count_type)} Count</>} />
            <StatusBadge status={count.status} colorMap={STATUS_COLORS} />
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {count.location ?? 'All locations'} &middot; {countedCount}/{lines.length} counted
            {totalVariance > 0 && ` · ${totalVariance} variance`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {count.status === 'planned' && (
            <Button variant="secondary" onClick={() => handleStatusChange('in_progress')}>Start Count</Button>
          )}
          {count.status === 'in_progress' && (
            <>
              <Button variant="secondary" loading={saving} onClick={handleSave}>
                {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Progress'}
              </Button>
              <Button onClick={() => { handleSave(); handleStatusChange('completed'); }}>
                Complete Count
              </Button>
            </>
          )}
          <Button variant="ghost" href="/app/warehouse/counts">Back</Button>
        </div>
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}
      {saved && <Alert variant="success" className="mb-6">Progress saved successfully.</Alert>}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Items</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{lines.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Counted</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{countedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Remaining</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{lines.length - countedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Variance</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${totalVariance > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {totalVariance}
          </p>
        </div>
      </div>

      {/* Worksheet table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">ID</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Expected</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-28">Counted</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map((line) => {
                const variance = line.counted_quantity != null
                  ? line.counted_quantity - line.expected_quantity
                  : null;
                return (
                  <tr key={line.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">{line.asset_name}</td>
                    <td className="px-6 py-3 text-sm text-text-secondary">{line.asset_category}</td>
                    <td className="px-6 py-3 text-xs font-mono text-text-muted">
                      {line.asset_barcode || line.asset_serial || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-center tabular-nums text-foreground">{line.expected_quantity}</td>
                    <td className="px-6 py-3 text-center">
                      {isEditable ? (
                        <FormInput
                          type="number"
                          min="0"
                          inputSize="compact"
                          className="w-20 mx-auto text-center tabular-nums"
                          value={line.counted_quantity ?? ''}
                          onChange={(e) => updateLine(line.id, 'counted_quantity', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      ) : (
                        <span className="text-sm tabular-nums">{line.counted_quantity ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {variance != null ? (
                        <span className={`text-sm font-medium tabular-nums ${
                          variance === 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary">
                      {line.condition_observed ?? line.asset_condition}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
