import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import CampaignsHubTabs from '../../CampaignsHubTabs';

async function getScheduled() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('campaigns')
      .select('id, name, subject, scheduled_at, recipient_count')
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });
    return (data ?? []) as Array<{ id: string; name: string; subject: string | null; scheduled_at: string | null; recipient_count: number }>;
  } catch { return []; }
}

export default async function ScheduledPage() {
  const scheduled = await getScheduled();

  return (
    <TierGate feature="email_campaigns">
      <PageHeader title="Scheduled" subtitle="Upcoming campaigns scheduled for delivery." />
      <CampaignsHubTabs />

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {scheduled.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No scheduled campaigns. Schedule a campaign from the drafts view.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Scheduled For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scheduled.map((item) => (
                <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/app/campaigns/${item.id}`} className="font-medium text-foreground hover:underline">{item.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{item.subject ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{item.recipient_count ?? 0}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
