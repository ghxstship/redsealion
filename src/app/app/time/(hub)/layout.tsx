import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import TimeHubTabs from '../TimeHubTabs';

export default async function TimeHubLayout({ children }: { children: React.ReactNode }) {
  let pendingCount = 0;
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (ctx) {
      const { count } = await supabase
        .from('timesheets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'submitted');
      pendingCount = count ?? 0;
    }
  } catch (e) {
    // ignore
  }

  return (
    <TierGate feature="time_tracking">
      <div className="mb-2">
        <TimeHubTabs pendingCount={pendingCount} />
      </div>
      <div>
        {children}
      </div>
    </TierGate>
  );
}
