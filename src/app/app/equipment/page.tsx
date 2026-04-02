import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  status: string;
  current_location: string;
  serial_number: string | null;
  reservation_count: number;
}

const fallbackEquipment: EquipmentItem[] = [
  { id: 'eq_001', name: 'Martin MAC Aura XB', category: 'Lighting', status: 'available', current_location: 'Warehouse A', serial_number: 'MA-2024-0891', reservation_count: 3 },
  { id: 'eq_002', name: 'L-Acoustics K2 Array', category: 'Audio', status: 'deployed', current_location: 'Convention Center Hall A', serial_number: 'LA-K2-1544', reservation_count: 5 },
  { id: 'eq_003', name: 'Barco UDX-4K32', category: 'Video', status: 'available', current_location: 'Warehouse A', serial_number: 'BC-4K-0332', reservation_count: 2 },
  { id: 'eq_004', name: 'Disguise GX 2c', category: 'Media Server', status: 'maintenance', current_location: 'Repair Shop', serial_number: 'DG-GX2C-0118', reservation_count: 1 },
  { id: 'eq_005', name: 'Tyler GT Truss 12x12', category: 'Rigging', status: 'available', current_location: 'Warehouse B', serial_number: null, reservation_count: 4 },
  { id: 'eq_006', name: 'ROE Visual CB5 Panel', category: 'LED', status: 'deployed', current_location: 'Barclays Center', serial_number: 'ROE-CB5-0764', reservation_count: 6 },
  { id: 'eq_007', name: 'Shure Axient Digital', category: 'Audio', status: 'available', current_location: 'Warehouse A', serial_number: 'SH-AXD-2201', reservation_count: 2 },
  { id: 'eq_008', name: 'GrandMA3 Full-Size', category: 'Lighting Control', status: 'reserved', current_location: 'Warehouse A', serial_number: 'GM3-FS-0045', reservation_count: 3 },
];

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  deployed: 'bg-blue-50 text-blue-700',
  reserved: 'bg-yellow-50 text-yellow-700',
  maintenance: 'bg-red-50 text-red-700',
};

async function getEquipment(): Promise<EquipmentItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) throw new Error('No org');

    const { data: items } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('name');

    if (!items || items.length === 0) throw new Error('No equipment');

    return items.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      name: item.name as string,
      category: (item.category as string) ?? 'Uncategorized',
      status: (item.status as string) ?? 'available',
      current_location: (item.current_location as string) ?? 'Unknown',
      serial_number: (item.serial_number as string) ?? null,
      reservation_count: (item.reservation_count as number) ?? 0,
    }));
  } catch {
    return fallbackEquipment;
  }
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function EquipmentPage() {
  const equipment = await getEquipment();

  const statusCounts = equipment.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Equipment
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {equipment.length} assets &middot;{' '}
            {statusCounts.available ?? 0} available &middot;{' '}
            {statusCounts.deployed ?? 0} deployed
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/equipment/bundles"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Bundles
          </Link>
          <Link
            href="/app/equipment/maintenance"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Maintenance
          </Link>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {(['available', 'deployed', 'reserved', 'maintenance'] as const).map((status) => (
          <div key={status} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{formatLabel(status)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {statusCounts[status] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Serial #</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Reservations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {equipment.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3.5">
                  <Link
                    href={`/app/equipment/${item.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(item.status)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{item.current_location}</td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-text-muted">
                  {item.serial_number ?? '\u2014'}
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                  {item.reservation_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
