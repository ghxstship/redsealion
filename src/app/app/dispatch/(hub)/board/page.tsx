import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import DispatchHubTabs from '../../DispatchHubTabs';
import DispatchKanban, { BoardItem } from '@/components/admin/work-orders/DispatchKanban';
import Alert from '@/components/ui/Alert';

async function getDispatchBoard() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { columns: {} as Record<string, BoardItem[]>, error: null };
    const { data, error } = await supabase
      .from('work_orders')
      .select('id, title, status, location_name, location_address, scheduled_start, work_order_assignments(crew_profiles(full_name))')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .in('status', ['draft', 'dispatched', 'in_progress', 'completed'])
      .order('scheduled_start', { ascending: true });

    if (error) return { columns: {} as Record<string, BoardItem[]>, error: error.message };

    const items = (data ?? []) as unknown as BoardItem[];
    const columns = items.reduce((acc, item) => {
      acc[item.status] = acc[item.status] ?? [];
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, BoardItem[]>);
    return { columns, error: null };
  } catch {
    return { columns: {} as Record<string, BoardItem[]>, error: 'Failed to load dispatch board.' };
  }
}

export default async function DispatchBoardPage() {
  const { columns, error } = await getDispatchBoard();
  const statuses = ['draft', 'dispatched', 'in_progress', 'completed'];

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Dispatch Board" subtitle="Kanban view of dispatch status across active jobs." />
      <DispatchHubTabs />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {!error && <DispatchKanban initialColumns={columns} statuses={statuses} />}
    </TierGate>
  );
}
