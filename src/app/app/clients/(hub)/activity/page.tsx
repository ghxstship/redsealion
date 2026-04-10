import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ClientsHubTabs from '../../ClientsHubTabs';

async function getActivity() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('deal_activities')
      .select('id, type, description, created_at, deals(title, clients(company_name))')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(50);
    // Supabase deeply-nested join return type differs from actual runtime shape; cast at boundary
    return (data ?? []) as unknown as Array<{
      id: string; type: string; description: string | null; created_at: string;
      deals: { title: string; clients: { company_name: string } | null } | null;
    }>;
  } catch { return []; }
}

export default async function ClientActivityPage() {
  const activities = await getActivity();

  const typeIcons: Record<string, string> = { call: '📞', email: '📧', meeting: '🤝', note: '📝', task: '✅' };

  return (
    <TierGate feature="clients">
      <PageHeader title="Client Activity" subtitle="Recent interactions and touchpoints across all clients." />
      <ClientsHubTabs />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {activities.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No recent client activity. Interactions logged from deals and emails will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div key={activity.id} className="px-5 py-4 flex items-start gap-3">
                <span className="text-lg mt-0.5">{typeIcons[activity.type] ?? '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary capitalize">{activity.type}</span>
                    {activity.deals?.clients?.company_name && (
                      <span className="text-xs text-text-muted">• {activity.deals.clients.company_name}</span>
                    )}
                  </div>
                  {activity.description && <p className="text-sm text-text-secondary mt-1 line-clamp-2">{activity.description}</p>}
                  {activity.deals?.title && <p className="text-xs text-text-muted mt-1">Deal: {activity.deals.title}</p>}
                </div>
                <p className="text-xs text-text-muted whitespace-nowrap">{new Date(activity.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TierGate>
  );
}
