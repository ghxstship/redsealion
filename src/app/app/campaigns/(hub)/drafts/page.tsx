import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import CampaignsHubTabs from '../../CampaignsHubTabs';

async function getDrafts() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('campaigns')
      .select('id, name, subject, updated_at')
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    return (data ?? []) as Array<{ id: string; name: string; subject: string | null; updated_at: string }>;
  } catch { return []; }
}

export default async function DraftsPage() {
  const drafts = await getDrafts();

  return (
    <TierGate feature="email_campaigns">
      <PageHeader title="Drafts" subtitle="Saved campaign drafts pending review and scheduling." />
      <CampaignsHubTabs />

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {drafts.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No draft campaigns. Create a new campaign to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {drafts.map((draft) => (
              <Link key={draft.id} href={`/app/campaigns/${draft.id}`} className="block px-5 py-4 hover:bg-bg-secondary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{draft.name}</p>
                    {draft.subject && <p className="text-xs text-text-secondary mt-0.5">Subject: {draft.subject}</p>}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700">Draft</span>
                    <p className="text-xs text-text-muted mt-1">{new Date(draft.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </TierGate>
  );
}
