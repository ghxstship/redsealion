import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import CampaignsHubTabs from '../../CampaignsHubTabs';

async function getAudiences() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { clients: 0, leads: 0, crew: 0 };
    const [clientRes, leadRes, crewRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.organizationId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.organizationId),
      supabase.from('crew_profiles').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.organizationId),
    ]);
    return { clients: clientRes.count ?? 0, leads: leadRes.count ?? 0, crew: crewRes.count ?? 0 };
  } catch { return { clients: 0, leads: 0, crew: 0 }; }
}

export default async function AudiencesPage() {
  const counts = await getAudiences();
  const total = counts.clients + counts.leads + counts.crew;

  return (
    <TierGate feature="email_campaigns">
      <PageHeader title="Audiences" subtitle="Manage contact lists and segments for targeted campaigns." />
      <CampaignsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Contacts', value: total },
          { label: 'Clients', value: counts.clients, color: 'text-blue-600' },
          { label: 'Leads', value: counts.leads, color: 'text-purple-600' },
          { label: 'Crew', value: counts.crew, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {[
          { name: 'All Clients', count: counts.clients, desc: 'Every client in your CRM' },
          { name: 'Active Leads', count: counts.leads, desc: 'Leads in your pipeline' },
          { name: 'Crew Members', count: counts.crew, desc: 'All crew profiles' },
        ].map((audience) => (
          <div key={audience.name} className="rounded-xl border border-border bg-white px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{audience.name}</p>
              <p className="text-xs text-text-secondary mt-0.5">{audience.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-foreground">{audience.count}</p>
              <p className="text-xs text-text-muted">contacts</p>
            </div>
          </div>
        ))}
      </div>
    </TierGate>
  );
}
