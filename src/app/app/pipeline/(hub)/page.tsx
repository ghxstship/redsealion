import { TierGate } from '@/components/shared/TierGate';
import PipelineViewSwitcher from '@/components/admin/pipeline/PipelineViewSwitcher';
import PipelineHeader from '@/components/admin/pipeline/PipelineHeader';
import { createClient } from '@/lib/supabase/server';
import type { Deal } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import PipelineHubTabs from '../PipelineHubTabs';
import { castRelation } from '@/lib/supabase/cast-relation';

type DealWithClient = Deal & { client_name: string; owner_name: string | null };

async function getDeals(): Promise<DealWithClient[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];
const { data: deals } = await supabase
      .from('deals')
      .select('*, clients(company_name), users!deals_owner_id_fkey(full_name)')
      .eq('organization_id', ctx.organizationId)
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

export default async function PipelinePage() {
  const deals = await getDeals();

  return (
    <>
<PageHeader
        title="Pipeline"
        subtitle="Track deals from lead to close"
      >
        <PipelineHeader />
      </PageHeader>

      <PipelineHubTabs />

      <TierGate feature="pipeline">
        <PipelineViewSwitcher deals={deals} />
      </TierGate>
    </>
  );
}
