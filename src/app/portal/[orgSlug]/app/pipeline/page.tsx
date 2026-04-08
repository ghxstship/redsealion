import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import { TierGate } from '@/components/shared/TierGate';
import PipelineBoard from '@/components/admin/pipeline/PipelineBoard';
import type { Deal } from '@/types/database';
import { castRelation } from '@/lib/supabase/cast-relation';

interface PortalPipelinePageProps {
  params: Promise<{ orgSlug: string }>;
}

type DealWithClient = Deal & { client_name: string; owner_name: string | null };

async function getDeals(orgId: string): Promise<DealWithClient[]> {
  try {
    const supabase = await createClient();

    const { data: deals } = await supabase
      .from('deals')
      .select('*, clients(company_name), users!deals_owner_id_fkey(full_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (!deals) return [];

    return deals.map((d: Record<string, unknown>) => {
      const { clients: _clients, users: _users, ...rest } = d;
      return {
        ...rest,
        client_name: castRelation<Record<string, string>>(_clients)?.company_name ?? 'Unknown',
        owner_name: castRelation<Record<string, string>>(_users)?.full_name ?? null,
      } as DealWithClient;
    });
  } catch {
    return [];
  }
}

export default async function PortalPipelinePage({ params }: PortalPipelinePageProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  const deals = await getDeals(org.organizationId);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pipeline
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Track deals from lead to close
          </p>
        </div>
      </div>

      <TierGate feature="pipeline">
        <PipelineBoard initialDeals={deals} />
      </TierGate>
    </>
  );
}
