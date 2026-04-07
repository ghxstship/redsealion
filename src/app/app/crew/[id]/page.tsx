import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import ComplianceDocumentsPanel from '@/components/admin/crew/ComplianceDocumentsPanel';
import CrewRatingsPanel from '@/components/admin/crew/CrewRatingsPanel';
import CrewDetailTabs from './CrewDetailTabs';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';

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

const fallbackProfile: CrewDetail = {
  full_name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  phone: '+1 310 555 0199',
  skills: ['Lighting', 'Rigging', 'Stage Design'],
  certifications: ['ETCP Rigging', 'OSHA 30', 'First Aid/CPR'],
  hourly_rate: 75,
  day_rate: 600,
  availability_status: 'available',
  onboarding_status: 'complete',
  emergency_contact_name: 'Maria Rivera',
  emergency_contact_phone: '+1 310 555 0200',
  bio: 'Experienced lighting designer and rigger with 8+ years in live events and experiential production.',
  bookings: [
    { id: 'bk_001', project_name: 'Nike SNKRS Fest 2026', venue: 'Convention Center Hall A', date: '2026-04-15', status: 'confirmed' },
    { id: 'bk_002', project_name: 'Samsung Galaxy Unpacked', venue: 'Barclays Center', date: '2026-04-22', status: 'tentative' },
    { id: 'bk_003', project_name: 'Spotify Wrapped Live', venue: 'Pier 17', date: '2026-05-10', status: 'confirmed' },
  ],
};

async function getCrewMember(id: string): Promise<CrewDetail> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('*, users(email)')
      .eq('id', id)
      .single();

    if (!profile) throw new Error('Not found');

    const { data: bookings } = await supabase
      .from('crew_bookings')
      .select('id, project_name, venue, date, status')
      .eq('crew_profile_id', id)
      .order('date', { ascending: true })
      .limit(10);

    return {
      full_name: profile.full_name,
      email: (profile.users as Record<string, string>)?.email ?? '',
      phone: profile.phone ?? null,
      skills: profile.skills ?? [],
      certifications: profile.certifications ?? [],
      hourly_rate: profile.hourly_rate ?? null,
      day_rate: profile.day_rate ?? null,
      availability_status: profile.availability_status ?? 'available',
      onboarding_status: profile.onboarding_status ?? 'pending',
      emergency_contact_name: profile.emergency_contact_name ?? null,
      emergency_contact_phone: profile.emergency_contact_phone ?? null,
      bio: profile.bio ?? null,
      bookings: (bookings ?? []).map((b: Record<string, unknown>) => ({
        id: b.id as string,
        project_name: b.project_name as string,
        venue: b.venue as string,
        date: b.date as string,
        status: b.status as string,
      })),
    };
  } catch {
    return fallbackProfile;
  }
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  unavailable: 'bg-red-50 text-red-700',
  tentative: 'bg-yellow-50 text-yellow-700',
};

const ONBOARDING_COLORS: Record<string, string> = {
  complete: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  pending: 'bg-gray-100 text-gray-600',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  tentative: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-red-50 text-red-700',
};

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
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Bio</h2>
          <p className="text-sm text-text-secondary">{member.bio}</p>
        </div>
      )}

      {/* Skills */}
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {member.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {skill}
            </span>
          ))}
          {member.skills.length === 0 && (
            <p className="text-sm text-text-muted">No skills listed.</p>
          )}
        </div>
      </div>

      {/* Certifications */}
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Certifications</h2>
        <div className="flex flex-wrap gap-2">
          {member.certifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {cert}
            </span>
          ))}
          {member.certifications.length === 0 && (
            <p className="text-sm text-text-muted">No certifications listed.</p>
          )}
        </div>
      </div>
    </div>
  );

  const bookingsContent = (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Recent Bookings</h2>
      </div>
      {member.bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {member.bookings.map((booking) => (
                <tr key={booking.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">{booking.project_name}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{booking.venue}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(booking.date)}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        BOOKING_STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatLabel(booking.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              AVAILABILITY_COLORS[member.availability_status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {formatLabel(member.availability_status)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              ONBOARDING_COLORS[member.onboarding_status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            Onboarding: {formatLabel(member.onboarding_status)}
          </span>
        </div>
        <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
          Edit Profile
        </button>
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
