import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface Reservation {
  id: string;
  project_name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string;
  date: string;
  performed_by: string;
}

interface EquipmentDetail {
  name: string;
  category: string;
  status: string;
  current_location: string;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  notes: string | null;
  reservations: Reservation[];
  maintenance_history: MaintenanceRecord[];
}

const fallbackDetail: EquipmentDetail = {
  name: 'Martin MAC Aura XB',
  category: 'Lighting',
  status: 'available',
  current_location: 'Warehouse A',
  serial_number: 'MA-2024-0891',
  purchase_date: '2024-06-15',
  purchase_price: 8500,
  notes: 'Part of the main lighting rig. Recently serviced.',
  reservations: [
    { id: 'res_001', project_name: 'Nike SNKRS Fest 2026', start_date: '2026-04-12', end_date: '2026-04-17', status: 'confirmed' },
    { id: 'res_002', project_name: 'Samsung Galaxy Unpacked', start_date: '2026-04-20', end_date: '2026-04-24', status: 'tentative' },
    { id: 'res_003', project_name: 'Spotify Wrapped Live', start_date: '2026-05-08', end_date: '2026-05-12', status: 'confirmed' },
  ],
  maintenance_history: [
    { id: 'mnt_001', type: 'Preventive', description: 'Lamp replacement and lens cleaning', date: '2026-03-01', performed_by: 'Tech Services Inc.' },
    { id: 'mnt_002', type: 'Repair', description: 'Pan motor replacement', date: '2025-11-15', performed_by: 'In-house' },
  ],
};

async function getEquipmentDetail(id: string): Promise<EquipmentDetail> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: item } = await supabase
      .from('assets')
      .select()
      .eq('id', id)
      .single();

    if (!item) throw new Error('Not found');

    const [resResult, mntResult] = await Promise.all([
      supabase
        .from('equipment_reservations')
        .select('id, proposal_id, reserved_from, reserved_until, status')
        .eq('asset_id', id)
        .order('reserved_from', { ascending: true }),
      supabase
        .from('maintenance_records')
        .select('id, type, description, scheduled_date, performed_by')
        .eq('asset_id', id)
        .order('scheduled_date', { ascending: false }),
    ]);

    return {
      name: item.name,
      category: item.category ?? 'Uncategorized',
      status: item.status ?? 'available',
      current_location: item.current_location ?? 'Unknown',
      serial_number: item.serial_number ?? null,
      purchase_date: item.purchase_date ?? null,
      purchase_price: item.purchase_price ?? null,
      notes: item.notes ?? null,
      reservations: (resResult.data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        project_name: r.project_name as string,
        start_date: r.start_date as string,
        end_date: r.end_date as string,
        status: r.status as string,
      })),
      maintenance_history: (mntResult.data ?? []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        type: m.type as string,
        description: m.description as string,
        date: m.date as string,
        performed_by: m.performed_by as string,
      })),
    };
  } catch {
    return fallbackDetail;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  deployed: 'bg-blue-50 text-blue-700',
  reserved: 'bg-yellow-50 text-yellow-700',
  maintenance: 'bg-red-50 text-red-700',
  confirmed: 'bg-green-50 text-green-700',
  tentative: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getEquipmentDetail(id);

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/equipment" className="hover:text-foreground transition-colors">
          Equipment
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{item.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {item.name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {item.category} &middot; {item.current_location}
          </p>
          <div className="mt-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {formatLabel(item.status)}
            </span>
          </div>
        </div>
        <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
          Edit Asset
        </button>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border bg-white p-6 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Asset Details</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {item.serial_number && (
            <div>
              <p className="text-xs text-text-muted">Serial Number</p>
              <p className="text-sm font-medium text-foreground">{item.serial_number}</p>
            </div>
          )}
          {item.purchase_date && (
            <div>
              <p className="text-xs text-text-muted">Purchase Date</p>
              <p className="text-sm text-foreground">{formatDate(item.purchase_date)}</p>
            </div>
          )}
          {item.purchase_price != null && (
            <div>
              <p className="text-xs text-text-muted">Purchase Price</p>
              <p className="text-sm font-medium text-foreground">
                ${item.purchase_price.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted">Location</p>
            <p className="text-sm text-foreground">{item.current_location}</p>
          </div>
        </div>
        {item.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-secondary">{item.notes}</p>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Reservation Timeline */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Reservations</h2>
          </div>
          {item.reservations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Start</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {item.reservations.map((res) => (
                    <tr key={res.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{res.project_name}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(res.start_date)}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(res.end_date)}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[res.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {formatLabel(res.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-text-muted">
              No reservations.
            </div>
          )}
        </div>

        {/* Maintenance History */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Maintenance History</h2>
          </div>
          {item.maintenance_history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {item.maintenance_history.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{record.description}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(record.date)}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{record.performed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-text-muted">
              No maintenance records.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
