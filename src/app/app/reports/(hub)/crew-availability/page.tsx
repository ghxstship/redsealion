import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';

interface CrewAvailRow {
  name: string;
  email: string;
  role: string | null;
  availability: string;
  upcomingBookings: number;
}

async function getCrewAvailabilityData(): Promise<{
  members: CrewAvailRow[];
  totalCrew: number;
  available: number;
  unavailable: number;
  tentative: number;
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: profiles } = await supabase
      .from('crew_profiles')
      .select('user_id, availability_status, users(full_name, email, role)')
      .eq('organization_id', ctx.organizationId);

    if (!profiles || profiles.length === 0) {
      return { members: [], totalCrew: 0, available: 0, unavailable: 0, tentative: 0 };
    }

    // Count upcoming bookings per user
    const today = new Date().toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('crew_bookings')
      .select('user_id')
      .eq('organization_id', ctx.organizationId)
      .gte('end_date', today);

    const bookingMap = new Map<string, number>();
    for (const b of bookings ?? []) {
      const uid = b.user_id as string;
      bookingMap.set(uid, (bookingMap.get(uid) ?? 0) + 1);
    }

    const members: CrewAvailRow[] = (profiles as Array<Record<string, unknown>>).map((cp) => {
      const u = cp.users as Record<string, string> | undefined;
      return {
        name: u?.full_name ?? 'Unknown',
        email: u?.email ?? '',
        role: (u?.role as string) ?? null,
        availability: (cp.availability_status as string) ?? 'unavailable',
        upcomingBookings: bookingMap.get(cp.user_id as string) ?? 0,
      };
    }).sort((a, b) => {
      const order: Record<string, number> = { available: 0, tentative: 1, unavailable: 2 };
      return (order[a.availability] ?? 3) - (order[b.availability] ?? 3);
    });

    return {
      members,
      totalCrew: members.length,
      available: members.filter((m) => m.availability === 'available').length,
      unavailable: members.filter((m) => m.availability === 'unavailable').length,
      tentative: members.filter((m) => m.availability === 'tentative').length,
    };
  } catch {
    return { members: [], totalCrew: 0, available: 0, unavailable: 0, tentative: 0 };
  }
}

function availBadge(status: string) {
  switch (status) {
    case 'available': return <Badge variant="success">Available</Badge>;
    case 'tentative': return <Badge variant="warning">Tentative</Badge>;
    default: return <Badge variant="muted">Unavailable</Badge>;
  }
}

export default async function CrewAvailabilityPage() {
  const data = await getCrewAvailabilityData();

  return (
    <TierGate feature="crew">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Crew Availability</span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <PageHeader title="Crew Availability" subtitle="Current crew availability and upcoming booking load" />
        <Link href="/api/documents/crew-roster">
          <Button variant="secondary" size="sm">
            <Download size={14} className="mr-1.5" />
            Export Roster
          </Button>
        </Link>
      </div>

      <ReportsHubTabs />

      <MetricGrid
        metrics={[
          { label: 'Total Crew', value: String(data.totalCrew) },
          { label: 'Available', value: String(data.available), changeType: 'positive' },
          { label: 'Tentative', value: String(data.tentative), changeType: data.tentative > 0 ? 'negative' : 'neutral' },
          { label: 'Unavailable', value: String(data.unavailable), changeType: data.unavailable > 0 ? 'negative' : 'neutral' },
        ]}
      />

      {data.members.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No crew members found.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Email</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                  <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Upcoming</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.members.map((m) => (
                  <TableRow key={m.email} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{m.name}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{m.email}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary capitalize">{m.role?.replace(/_/g, ' ') ?? '\u2014'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-center">{availBadge(m.availability)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-center text-sm tabular-nums text-text-secondary">{m.upcomingBookings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
