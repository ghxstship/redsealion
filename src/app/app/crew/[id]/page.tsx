import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency, formatLabel, formatDate } from '@/lib/utils';
import StatusBadge, { CREW_AVAILABILITY_COLORS, CREW_ONBOARDING_COLORS, BOOKING_STATUS_COLORS } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Tag from '@/components/ui/Tag';
import ComplianceDocumentsPanel from '@/components/admin/crew/ComplianceDocumentsPanel';
import CrewRatingsPanel from '@/components/admin/crew/CrewRatingsPanel';
import CrewDetailTabs from './CrewDetailTabs';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface CrewDetail {
  full_name: string;
  email: string;
  phone: string | null;
  skills: string[];
  certifications: string[];
  hourly_rate: number | null;
  day_rate: number | null;
  availability_status: string;
  onboarding_status: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bio: string | null;
  bookings: Array<{
    id: string;
    project_name: string;
    venue: string;
    date: string;
    status: string;
  }>;
}



async function getCrewMember(id: string): Promise<CrewDetail> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No valid org context');
    
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('*, users(full_name, email)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (!profile) throw new Error('Not found');

    const userRec = profile.users as Record<string, string> | null;

    const { data: bookings } = await supabase
      .from('crew_bookings')
      .select('id, project_name, venue_name, shift_start, status')
      .eq('crew_profile_id', id)
      .is('deleted_at', null)
      .order('shift_start', { ascending: true })
      .limit(10);

    return {
      full_name: profile.full_name || userRec?.full_name || '',
      email: userRec?.email ?? '',
      phone: profile.phone ?? null,
      skills: profile.skills ?? [],
      certifications: Array.isArray(profile.certifications)
        ? (profile.certifications as Array<string | { name: string }>).map((c) => typeof c === 'string' ? c : c.name)
        : [],
      hourly_rate: profile.hourly_rate ?? null,
      day_rate: profile.day_rate ?? null,
      availability_status: profile.availability_status ?? profile.availability_default ?? 'available',
      onboarding_status: profile.onboarding_status ?? 'not_started',
      emergency_contact_name: profile.emergency_contact_name ?? null,
      emergency_contact_phone: profile.emergency_contact_phone ?? null,
      bio: profile.bio ?? null,
      bookings: (bookings ?? []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        project_name: (b.project_name as string) ?? 'Untitled',
        venue: (b.venue_name as string) ?? '—',
        date: b.shift_start ? new Date(b.shift_start as string).toISOString().split('T')[0] : '',
        status: b.status as string,
      })),
    };
  } catch {
    notFound();
  }
}



export default async function CrewMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCrewMember(id);

  /* ── Pre-render tab panels ── */

  const profileContent = (
    <div className="space-y-6">
      {/* Bio */}
      {member.bio && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Bio</h2>
          <p className="text-sm text-text-secondary">{member.bio}</p>
        </div>
      )}

      {/* Skills */}
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {member.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
          {member.skills.length === 0 && (
            <p className="text-sm text-text-muted">No skills listed.</p>
          )}
        </div>
      </div>

      {/* Certifications */}
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Certifications</h2>
        <div className="flex flex-wrap gap-2">
          {member.certifications.map((cert) => (
            <Tag key={cert} variant="info">{cert}</Tag>
          ))}
          {member.certifications.length === 0 && (
            <p className="text-sm text-text-muted">No certifications listed.</p>
          )}
        </div>
      </div>
    </div>
  );

  const bookingsContent = (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Recent Bookings</h2>
      </div>
      {member.bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Venue</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {member.bookings.map((booking) => (
                <TableRow key={booking.id} className="transition-colors hover:bg-bg-secondary/50">
                  <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{booking.project_name}</TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{booking.venue}</TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(booking.date)}</TableCell>
                  <TableCell className="px-6 py-3.5">
                    <StatusBadge status={booking.status} colorMap={BOOKING_STATUS_COLORS} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState message="No bookings yet" />
      )}
    </div>
  );

  const complianceContent = (
    <div className="space-y-6">
      <ComplianceDocumentsPanel crewId={id} />
      <CrewRatingsPanel crewId={id} />
    </div>
  );

  return (
    <>
      {/* Header */}
      <Link
        href="/app/crew"
        className="text-xs font-medium text-text-muted hover:text-foreground transition-colors mb-2 inline-block"
      >
        &larr; Crew Directory
      </Link>
      <PageHeader
        title={member.full_name}
        subtitle={member.email}
      >
        <div className="flex gap-2">
          <StatusBadge status={member.availability_status} colorMap={CREW_AVAILABILITY_COLORS} />
          <StatusBadge status={`Onboarding: ${member.onboarding_status}`} colorMap={CREW_ONBOARDING_COLORS} />
        </div>
        <a href={`/app/crew/${id}/edit`} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
          Edit Profile
        </a>
      </PageHeader>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column - Sidebar (always visible) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <Card>
            <h2 className="text-sm font-semibold text-foreground mb-4">Contact Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-sm text-foreground">{member.email}</p>
              </div>
              {member.phone && (
                <div>
                  <p className="text-xs text-text-muted">Phone</p>
                  <p className="text-sm text-foreground">{member.phone}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Rates */}
          <Card>
            <h2 className="text-sm font-semibold text-foreground mb-4">Rates</h2>
            <div className="space-y-3">
              {member.hourly_rate != null && (
                <div>
                  <p className="text-xs text-text-muted">Hourly Rate</p>
                  <p className="text-sm font-medium text-foreground">${member.hourly_rate}/hr</p>
                </div>
              )}
              {member.day_rate != null && (
                <div>
                  <p className="text-xs text-text-muted">Day Rate</p>
                  <p className="text-sm font-medium text-foreground">${member.day_rate}/day</p>
                </div>
              )}
            </div>
          </Card>

          {/* Emergency Contact */}
          {member.emergency_contact_name && (
            <Card>
              <h2 className="text-sm font-semibold text-foreground mb-4">Emergency Contact</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-muted">Name</p>
                  <p className="text-sm text-foreground">{member.emergency_contact_name}</p>
                </div>
                {member.emergency_contact_phone && (
                  <div>
                    <p className="text-xs text-text-muted">Phone</p>
                    <p className="text-sm text-foreground">{member.emergency_contact_phone}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right column — tabbed */}
        <div className="lg:col-span-2">
          <CrewDetailTabs
            bookingCount={member.bookings.length}
            profileContent={profileContent}
            bookingsContent={bookingsContent}
            complianceContent={complianceContent}
          />
        </div>
      </div>
    </>
  );
}
