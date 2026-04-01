import { getInitials } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  email: string;
  facility: string;
  rate_card: string | null;
  avatar_url: string | null;
}

const teamMembers: TeamMember[] = [
  {
    id: 'user_001',
    name: 'Alex Mercer',
    role: 'org_admin',
    title: 'Founder & Creative Director',
    email: 'alex@meridian.co',
    facility: 'Meridian HQ, Los Angeles',
    rate_card: null,
    avatar_url: null,
  },
  {
    id: 'user_002',
    name: 'Jordan Ellis',
    role: 'project_manager',
    title: 'Senior Project Manager',
    email: 'jordan@meridian.co',
    facility: 'Meridian HQ, Los Angeles',
    rate_card: '$125/hr',
    avatar_url: null,
  },
  {
    id: 'user_003',
    name: 'Priya Sharma',
    role: 'designer',
    title: 'Lead Experience Designer',
    email: 'priya@meridian.co',
    facility: 'Meridian HQ, Los Angeles',
    rate_card: '$110/hr',
    avatar_url: null,
  },
  {
    id: 'user_004',
    name: 'Marcus Dubois',
    role: 'fabricator',
    title: 'Fabrication Lead',
    email: 'marcus@meridian.co',
    facility: 'Meridian Fabrication, Long Beach',
    rate_card: '$95/hr',
    avatar_url: null,
  },
  {
    id: 'user_005',
    name: 'Keiko Tanaka',
    role: 'designer',
    title: 'Spatial Designer',
    email: 'keiko@meridian.co',
    facility: 'Meridian HQ, Los Angeles',
    rate_card: '$100/hr',
    avatar_url: null,
  },
  {
    id: 'user_006',
    name: 'David Okonkwo',
    role: 'installer',
    title: 'Install Supervisor',
    email: 'david@meridian.co',
    facility: 'Meridian Fabrication, Long Beach',
    rate_card: '$85/hr',
    avatar_url: null,
  },
];

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'Super Admin',
    org_admin: 'Admin',
    project_manager: 'Project Manager',
    designer: 'Designer',
    fabricator: 'Fabricator',
    installer: 'Installer',
    client_primary: 'Client',
    client_viewer: 'Client Viewer',
  };
  return map[role] ?? role;
}

function roleBadgeColor(role: string): string {
  const map: Record<string, string> = {
    org_admin: 'bg-indigo-50 text-indigo-700',
    project_manager: 'bg-blue-50 text-blue-700',
    designer: 'bg-purple-50 text-purple-700',
    fabricator: 'bg-orange-50 text-orange-700',
    installer: 'bg-green-50 text-green-700',
  };
  return map[role] ?? 'bg-gray-100 text-gray-700';
}

export default function TeamPage() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Team
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {teamMembers.length} members across {new Set(teamMembers.map((m) => m.facility)).size} facilities.
          </p>
        </div>
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

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-border bg-white px-6 py-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-tertiary">
                <span className="text-sm font-semibold text-text-secondary">
                  {getInitials(member.name)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{member.title}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Role</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor(member.role)}`}>
                  {roleLabel(member.role)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Facility</span>
                <span className="text-xs text-foreground text-right">{member.facility}</span>
              </div>
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
          </div>
        ))}
      </div>
    </>
  );
}
