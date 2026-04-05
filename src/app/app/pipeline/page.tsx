import { TierGate } from '@/components/shared/TierGate';
import PipelineBoard from '@/components/admin/pipeline/PipelineBoard';
import PipelineHeader from '@/components/admin/pipeline/PipelineHeader';
import { createClient } from '@/lib/supabase/server';
import type { Deal } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

type DealWithClient = Deal & { client_name: string };

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
      .select('*, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!deals) return [];

    return deals.map((d: Record<string, unknown>) => {
      const { clients: _clients, ...rest } = d;
      return {
        ...rest,
        client_name: (_clients as Record<string, string>)?.company_name ?? 'Unknown',
      } as unknown as DealWithClient;
    });
  } catch {
    return [];
  }
}

export default async function PipelinePage() {
  const deals = await getDeals();

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
        <PipelineHeader />
      </div>

      <TierGate feature="pipeline">
        <PipelineBoard initialDeals={deals} />
      </TierGate>
    </>
  );
}
