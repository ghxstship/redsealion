import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import CampaignsHubTabs from '../CampaignsHubTabs';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { CAMPAIGN_STATUS_COLORS } from '@/components/ui/StatusBadge';

async function getCampaigns() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('campaigns')
      .select()
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <TierGate feature="email_campaigns">
      <PageHeader
        title="Campaigns"
        subtitle="Send targeted email campaigns to your clients."
      >
        <Button href="/app/campaigns/new">New Campaign</Button>
      </PageHeader>

      <CampaignsHubTabs />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {campaigns.length === 0 ? (
          <EmptyState
            message="No campaigns yet"
            description="Create your first email campaign to reach your clients."
            action={
              <Link
                href="/app/campaigns/new"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Create Campaign
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Opens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((c: Record<string, unknown>) => (
                  <tr key={c.id as string} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5">
                      <Link href={`/app/campaigns/${c.id}`} className="text-sm font-medium text-foreground hover:underline">
                        {c.name as string}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{c.subject as string}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={c.status as string} colorMap={CAMPAIGN_STATUS_COLORS} />
                    </td>
                    <td className="px-6 py-3.5 text-sm tabular-nums text-text-muted">{c.sent_count as number}</td>
                    <td className="px-6 py-3.5 text-sm tabular-nums text-text-muted">{c.open_count as number}</td>
                    <td className="px-6 py-3.5 text-sm tabular-nums text-text-muted">{c.click_count as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
