import { TierGate } from '@/components/shared/TierGate';
import PipelineBoard from '@/components/admin/pipeline/PipelineBoard';
import { createClient } from '@/lib/supabase/server';
import { getSeedDeals, getSeedClients } from '@/lib/seed-data';

async function getDeals() {
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

    const { data: deals } = await supabase
      .from('deals')
      .select('*, clients(company_name)')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (!deals) throw new Error('No deals');

    return deals.map((d: Record<string, unknown>) => ({
      ...d,
      client_name: (d.clients as Record<string, string>)?.company_name ?? 'Unknown',
    }));
  } catch {
    // Fallback to seed data
    const deals = getSeedDeals();
    const clients = getSeedClients();
    return deals.map((d) => ({
      ...d,
      client_name:
        clients.find((c) => c.id === d.client_id)?.company_name ?? 'Unknown',
    }));
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
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          New Deal
        </button>
      </div>

      <TierGate feature="pipeline">
        <PipelineBoard initialDeals={deals} />
      </TierGate>
    </>
  );
}
