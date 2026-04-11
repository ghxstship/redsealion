import { TierGate } from '@/components/shared/TierGate';
import { IntegrationCard } from '@/components/admin/integrations/IntegrationCard';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import { PLATFORMS, CATEGORY_LABELS } from '@/lib/integrations/platforms';

async function getIntegrations() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];
const { data: integrations } = await supabase
      .from('integrations')
      .select('platform, status, last_sync_at')
      .eq('organization_id', ctx.organizationId);

    return integrations || [];
  } catch {
    return [];
  }
}

export default async function IntegrationsPage() {
  const categories = [...new Set(PLATFORMS.map((p) => p.category))];
  const activeIntegrations = await getIntegrations();

  const integrationsMap = new Map(
    activeIntegrations.map((i: { platform: string; status: string; last_sync_at: string | null }) => [i.platform, i])
  );

  return (
    <TierGate feature="integrations">
<PageHeader
        title="Integrations"
        subtitle="Connect your tools to sync data and automate workflows."
      />

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter((p) => p.category === category).map((p) => {
              const dbInt = integrationsMap.get(p.platform);
              return (
                <IntegrationCard
                  key={p.platform}
                  platform={p.platform}
                  displayName={p.displayName}
                  description={p.description}
                  category={p.category}
                  status={(dbInt?.status ?? 'disconnected') as 'disconnected' | 'connected' | 'error'}
                  lastSyncAt={dbInt?.last_sync_at ?? null}
                />
              );
            })}
          </div>
        </div>
      ))}
    </TierGate>
  );
}
