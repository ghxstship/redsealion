import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  facility: string | null;
  rate_card: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Admin',
  project_manager: 'Project Manager',
  designer: 'Designer',
  fabricator: 'Fabricator',
  installer: 'Installer',
  client_primary: 'Client',
  client_viewer: 'Client Viewer',
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-50 text-red-700',
  org_admin: 'bg-indigo-50 text-indigo-700',
  project_manager: 'bg-blue-50 text-blue-700',
  designer: 'bg-purple-50 text-purple-700',
  fabricator: 'bg-orange-50 text-orange-700',
  installer: 'bg-green-50 text-green-700',
};

async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) return [];

    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role, title, facility_id, rate_card')
      .eq('organization_id', userData.organization_id)
      .order('full_name');

    return (data ?? []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      title: u.title,
      facility: u.facility_id, // facility_id passed as-is; resolve via org.facilities join when UX requires display name
      rate_card: u.rate_card,
    }));
  } catch {
    return [];
  }
}

export default async function PeoplePage() {
  const members = await getTeamMembers();
  const roleCount = new Set(members.map((m) => m.role)).size;

  return (
    <TierGate feature="people_hr">
      <Breadcrumbs />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">People</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {members.length} team members &middot; {roleCount} {roleCount === 1 ? 'role' : 'roles'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/people/time-off"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Time Off
          </Link>
          <Link
            href="/app/people/org-chart"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Org Chart
          </Link>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="8" y1="2" x2="8" y2="14" />
              <line x1="2" y1="8" x2="14" y2="8" />
            </svg>
            Invite Member
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total People</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{members.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Roles</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{roleCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">With Rate Cards</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {members.filter((m) => m.rate_card).length}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No team members yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Invite your first team member to start collaborating on proposals and projects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/app/people/${member.id}`}
              className="group rounded-xl border border-border bg-white px-6 py-5 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-tertiary">
                  <span className="text-sm font-semibold text-text-secondary">
                    {getInitials(member.full_name)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:underline">
                    {member.full_name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {member.title ?? member.role.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Role</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[member.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </div>
                {member.facility && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Facility</span>
                    <span className="text-xs text-foreground text-right truncate ml-4">{member.facility}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Rate</span>
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {member.rate_card ?? '\u2014'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Email</span>
                  <span className="text-xs text-text-secondary truncate ml-4">{member.email}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TierGate>
  );
}
