import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import CampaignsHubTabs from '../../CampaignsHubTabs';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getAnalytics() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { total: 0, sent: 0, opened: 0, clicked: 0, campaigns: [] as Array<{ id: string; name: string; status: string; recipient_count: number; open_count: number; click_count: number; sent_at: string | null }> };
    const { data } = await supabase
      .from('campaigns')
      .select('id, name, status, recipient_count, open_count, click_count, sent_at')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['sent', 'completed'])
      .order('sent_at', { ascending: false })
      .limit(20);
    const campaigns = (data ?? []) as Array<{ id: string; name: string; status: string; recipient_count: number; open_count: number; click_count: number; sent_at: string | null }>;
    const total = campaigns.length;
    const sent = campaigns.reduce((s, c) => s + (c.recipient_count ?? 0), 0);
    const opened = campaigns.reduce((s, c) => s + (c.open_count ?? 0), 0);
    const clicked = campaigns.reduce((s, c) => s + (c.click_count ?? 0), 0);
    return { total, sent, opened, clicked, campaigns };
  } catch { return { total: 0, sent: 0, opened: 0, clicked: 0, campaigns: [] }; }
}

export default async function AnalyticsPage() {
  const { total, sent, opened, clicked, campaigns } = await getAnalytics();
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;

  return (
    <TierGate feature="email_campaigns">
      <PageHeader title="Campaign Analytics" subtitle="Track open rates, click-throughs, and conversions." />
      <CampaignsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Campaigns Sent', value: String(total) },
          { label: 'Total Recipients', value: sent.toLocaleString() },
          { label: 'Open Rate', value: `${openRate}%`, color: 'text-green-600' },
          { label: 'Click Rate', value: `${clickRate}%`, color: 'text-blue-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No campaigns sent yet. Analytics will appear after your first send.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Campaign</TableHead>
                  <TableHead className="px-4 py-3">Sent</TableHead>
                  <TableHead className="px-4 py-3">Recipients</TableHead>
                  <TableHead className="px-4 py-3">Opens</TableHead>
                  <TableHead className="px-4 py-3">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {campaigns.map((c) => (
                  <TableRow key={c.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{c.name}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{c.recipient_count ?? 0}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{c.open_count ?? 0}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{c.click_count ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
