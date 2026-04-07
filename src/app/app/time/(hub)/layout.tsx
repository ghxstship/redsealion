import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';

export default async function TimeHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <TierGate feature="time_tracking">
      {children}
    </TierGate>
  );
}
