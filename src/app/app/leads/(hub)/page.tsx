import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import LeadsHeader from '@/components/admin/leads/LeadsHeader';
import LeadsTable from '@/components/admin/leads/LeadsTable';
import LeadsHubTabs from '../LeadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';

import { RoleGate } from '@/components/shared/RoleGate';
interface Lead {
  id: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string | null;
  company_name: string | null;
  contact_phone: string | null;
  status: string;
  source: string;
  estimated_budget: number | null;
  message: string | null;
  event_type: string | null;
  event_date: string | null;
  assigned_to: string | null;
  assigned_user_name: string | null;
  converted_to_deal_id: string | null;
  converted_to_client_id: string | null;
  lost_reason: string | null;
  score: number;
  score_tier: string;
  created_at: string;
}

async function getLeads(): Promise<Lead[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: leads } = await supabase
      .from('leads')
      .select('*, users!leads_assigned_to_fkey(id, full_name)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(0, 99);

    if (!leads || leads.length === 0) return [];

    return leads.map((l: Record<string, unknown>) => {
      const assignedUser = l.users as Record<string, unknown> | null;
      return {
        id: l.id as string,
        contact_first_name: (l.contact_first_name as string) || '',
        contact_last_name: (l.contact_last_name as string) || '',
        contact_email: (l.contact_email as string) ?? null,
        company_name: (l.company_name as string) ?? null,
        contact_phone: (l.contact_phone as string) ?? null,
        status: (l.status as string) ?? 'new',
        source: (l.source as string) ?? 'Unknown',
        estimated_budget: (l.estimated_budget as number) ?? null,
        message: (l.message as string) ?? null,
        event_type: (l.event_type as string) ?? null,
        event_date: (l.event_date as string) ?? null,
        assigned_to: (l.assigned_to as string) ?? null,
        assigned_user_name: (assignedUser?.full_name as string) ?? null,
        converted_to_deal_id: (l.converted_to_deal_id as string) ?? null,
        converted_to_client_id: (l.converted_to_client_id as string) ?? null,
        lost_reason: (l.lost_reason as string) ?? null,
        score: (l.score as number) ?? 0,
        score_tier: (l.score_tier as string) ?? 'cold',
        created_at: l.created_at as string,
      };
    });
  } catch {
    return [];
  }
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <RoleGate>
    <>
      <PageHeader

        title="Inbox"

        subtitle={`${leads.length} leads in your inbox`}

      >

        <LeadsHeader />

      </PageHeader>

      <LeadsHubTabs />

      <LeadsTable leads={leads} />
    </>
  </RoleGate>
  );
}
