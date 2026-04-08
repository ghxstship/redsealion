import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import EquipmentHubTabs from '../../EquipmentHubTabs';

async function getCheckouts() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('asset_checkouts')
      .select('id, status, quantity, serial_number, barcode, destination, condition_out, condition_in, checked_out_at, checked_in_at, notes_out, notes_in, assets(name, category), events(name), rental_orders(order_number), checked_out_user:checked_out_by(full_name), checked_in_user:checked_in_by(full_name)')
      .eq('organization_id', ctx.organizationId)
      .order('checked_out_at', { ascending: false })
      .limit(100);
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      status: r.status as string,
      quantity: r.quantity as number,
      serial_number: r.serial_number as string | null,
      barcode: r.barcode as string | null,
      destination: r.destination as string | null,
      condition_out: r.condition_out as string,
      condition_in: r.condition_in as string | null,
      checked_out_at: r.checked_out_at as string,
      checked_in_at: r.checked_in_at as string | null,
      notes_out: r.notes_out as string | null,
      notes_in: r.notes_in as string | null,
      asset_name: Array.isArray(r.assets) ? (r.assets as Record<string, unknown>[])[0]?.name as string : (r.assets as Record<string, unknown> | null)?.name as string ?? 'Unknown',
      asset_category: Array.isArray(r.assets) ? (r.assets as Record<string, unknown>[])[0]?.category as string : (r.assets as Record<string, unknown> | null)?.category as string ?? null,
      event_name: Array.isArray(r.events) ? (r.events as Record<string, unknown>[])[0]?.name as string : (r.events as Record<string, unknown> | null)?.name as string ?? null,
      rental_order: Array.isArray(r.rental_orders) ? (r.rental_orders as Record<string, unknown>[])[0]?.order_number as string : (r.rental_orders as Record<string, unknown> | null)?.order_number as string ?? null,
      checked_out_by_name: Array.isArray(r.checked_out_user) ? (r.checked_out_user as Record<string, unknown>[])[0]?.full_name as string : (r.checked_out_user as Record<string, unknown> | null)?.full_name as string ?? null,
      checked_in_by_name: Array.isArray(r.checked_in_user) ? (r.checked_in_user as Record<string, unknown>[])[0]?.full_name as string : (r.checked_in_user as Record<string, unknown> | null)?.full_name as string ?? null,
    }));
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = {
  checked_out: 'bg-blue-50 text-blue-700',
  in_transit: 'bg-purple-50 text-purple-700',
  on_site: 'bg-green-50 text-green-700',
  checked_in: 'bg-bg-secondary text-text-secondary',
  lost: 'bg-red-50 text-red-700',
  damaged_return: 'bg-orange-50 text-orange-700',
};

const CONDITION_COLORS: Record<string, string> = {
  new: 'text-green-600',
  good: 'text-green-600',
  fair: 'text-yellow-600',
  damaged: 'text-red-600',
  lost: 'text-red-600',
};

const STATUS_ICONS: Record<string, string> = {
  checked_out: '📤',
  in_transit: '🚚',
  on_site: '📍',
  checked_in: '📥',
  lost: '❌',
  damaged_return: '⚠️',
};

export default async function CheckInOutPage() {
  const checkouts = await getCheckouts();
  const currentlyOut = checkouts.filter((c) => ['checked_out', 'in_transit', 'on_site'].includes(c.status));
  const returned = checkouts.filter((c) => c.status === 'checked_in');
  const issues = checkouts.filter((c) => ['lost', 'damaged_return'].includes(c.status));

  return (
    <TierGate feature="equipment">
      <PageHeader title="Check In / Out" subtitle="Unified asset custody tracking for rentals, events, and productions." />
      <EquipmentHubTabs />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Currently Out', value: currentlyOut.length, color: 'text-blue-600' },
          { label: 'On Site', value: checkouts.filter((c) => c.status === 'on_site').length, color: 'text-green-600' },
          { label: 'Returned', value: returned.length },
          { label: 'Issues', value: issues.length, color: issues.length > 0 ? 'text-red-600' : 'text-foreground' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Currently Out — priority section */}
      {currentlyOut.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Currently Checked Out ({currentlyOut.length})
          </h3>
          <div className="rounded-xl border border-border bg-background mb-8 divide-y divide-border">
            {currentlyOut.map((c) => (
              <div key={c.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-lg mt-0.5">{STATUS_ICONS[c.status]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.asset_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted">
                      {c.serial_number && <span className="font-mono">SN: {c.serial_number}</span>}
                      {c.barcode && <span className="font-mono">BC: {c.barcode}</span>}
                      <span>Qty: {c.quantity}</span>
                      {c.asset_category && <span className="rounded-full bg-bg-secondary px-2 py-0.5">{c.asset_category}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-secondary">
                      {c.event_name && <span>📅 {c.event_name}</span>}
                      {c.rental_order && <span>🏷️ {c.rental_order}</span>}
                      {c.destination && <span>📍 {c.destination}</span>}
                    </div>
                    {c.checked_out_by_name && (
                      <p className="text-xs text-text-muted mt-1">Checked out by: {c.checked_out_by_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-text-muted mt-1">{new Date(c.checked_out_at).toLocaleDateString()}</p>
                  <p className={`text-xs mt-0.5 ${CONDITION_COLORS[c.condition_out]}`}>
                    Condition: {c.condition_out}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Full history table */}
      <h3 className="text-sm font-semibold text-foreground mb-3">All Transactions</h3>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {checkouts.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No check-in/out records. Transactions appear when assets are checked out for events, rentals, or productions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">For</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Out</th>
                  <th className="px-4 py-3">In</th>
                  <th className="px-4 py-3">Cond. Out</th>
                  <th className="px-4 py-3">Cond. In</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {checkouts.map((c) => (
                  <tr key={c.id} className={`hover:bg-bg-secondary/50 transition-colors ${c.status === 'lost' || c.status === 'damaged_return' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.asset_name}</p>
                      {c.serial_number && <p className="font-mono text-xs text-text-muted">{c.serial_number}</p>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {c.event_name ?? c.rental_order ?? c.destination ?? '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.quantity}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{new Date(c.checked_out_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{c.checked_in_at ? new Date(c.checked_in_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium capitalize ${CONDITION_COLORS[c.condition_out]}`}>{c.condition_out}</span></td>
                    <td className="px-4 py-3">{c.condition_in ? <span className={`text-xs font-medium capitalize ${CONDITION_COLORS[c.condition_in]}`}>{c.condition_in}</span> : '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{c.checked_out_by_name ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
