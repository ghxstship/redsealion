import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EquipmentTable from '@/components/admin/equipment/EquipmentTable';
import EquipmentHeader from '@/components/admin/equipment/EquipmentHeader';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import EquipmentHubTabs from '../EquipmentHubTabs';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  status: string;
  current_location: string;
  serial_number: string | null;
  reservation_count: number;
}

async function getEquipment(): Promise<EquipmentItem[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: items } = await supabase
      .from('assets')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('name');

    if (!items || items.length === 0) return [];

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
    return [];
  }
}

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function EquipmentPage() {
  const equipment = await getEquipment();

  const statusCounts = equipment.reduce(
    (acc, item) => { acc[item.status] = (acc[item.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Equipment"
        subtitle={`${equipment.length} assets · ${statusCounts.available ?? 0} available · ${statusCounts.deployed ?? 0} deployed`}
      >
        <EquipmentHeader />
      </PageHeader>

      <EquipmentHubTabs />

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {(['planned', 'deployed', 'in_storage', 'retired'] as const).map((status) => (
          <Card key={status} padding="sm">
            <p className="text-xs text-text-muted">{formatLabel(status)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{statusCounts[status] ?? 0}</p>
          </Card>
        ))}
      </div>


      <EquipmentTable equipment={equipment} />
    </>
  );
}
