import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import LeadsTable from '@/components/admin/leads/LeadsTable';

interface PortalLeadsPageProps {
  params: Promise<{ orgSlug: string }>;
}

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
  created_at: string;
}

async function getLeads(orgId: string): Promise<Lead[]> {
  try {
    const supabase = await createClient();

    const { data: leads } = await supabase
      .from('leads')
      .select()
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) return [];

    return leads.map((l: Record<string, unknown>) => ({
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
      created_at: l.created_at as string,
    }));
  } catch {
    return [];
  }
}

export default async function PortalLeadsPage({ params }: PortalLeadsPageProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  const leads = await getLeads(org.organizationId);

  return (
    <>
      {/* Header — no create button in portal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Leads
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {leads.length} leads in the inbox
          </p>
        </div>
      </div>

      <LeadsTable leads={leads} />
    </>
  );
}
