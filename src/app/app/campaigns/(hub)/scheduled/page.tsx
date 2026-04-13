import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import CampaignsHubTabs from '../../CampaignsHubTabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {scheduled.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No scheduled campaigns. Schedule a campaign from the drafts view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Campaign</TableHead>
                  <TableHead className="px-4 py-3">Subject</TableHead>
                  <TableHead className="px-4 py-3">Recipients</TableHead>
                  <TableHead className="px-4 py-3">Scheduled For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {scheduled.map((item) => (
                  <TableRow key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <Link href={`/app/campaigns/${item.id}`} className="font-medium text-foreground hover:underline">{item.name}</Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.subject ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{item.recipient_count ?? 0}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '—'}</TableCell>
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
