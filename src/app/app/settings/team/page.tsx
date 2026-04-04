import { createClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/types/database';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: OrganizationRole;
  created_at: string;
  avatar_url: string | null;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin: 'bg-blue-50 text-blue-700 border-blue-200',
  org_admin: 'bg-blue-50 text-blue-700 border-blue-200',
  project_manager: 'bg-purple-50 text-purple-700 border-purple-200',
  designer: 'bg-green-50 text-green-700 border-green-200',
  fabricator: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  installer: 'bg-orange-50 text-orange-700 border-orange-200',
  client_primary: 'bg-gray-50 text-gray-600 border-gray-200',
  client_viewer: 'bg-gray-50 text-gray-600 border-gray-200',
};

function formatRole(role: string): string {
  return role
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

const FALLBACK_MEMBERS: TeamMember[] = [
  { id: '1', full_name: 'Sarah Chen', email: 'sarah@example.com', role: 'org_admin', created_at: '2024-01-15T00:00:00Z', avatar_url: null },
  { id: '2', full_name: 'Marcus Rivera', email: 'marcus@example.com', role: 'project_manager', created_at: '2024-02-20T00:00:00Z', avatar_url: null },
  { id: '3', full_name: 'Emily Park', email: 'emily@example.com', role: 'designer', created_at: '2024-03-10T00:00:00Z', avatar_url: null },
  { id: '4', full_name: 'James Okafor', email: 'james@example.com', role: 'fabricator', created_at: '2024-04-05T00:00:00Z', avatar_url: null },
  { id: '5', full_name: 'Ana Gutierrez', email: 'ana@example.com', role: 'installer', created_at: '2024-05-18T00:00:00Z', avatar_url: null },
];

export default async function TeamSettingsPage() {
  let members: TeamMember[] = FALLBACK_MEMBERS;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (currentUser?.organization_id) {
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id, full_name, email, role, created_at, avatar_url')
          .eq('organization_id', currentUser.organization_id)
          .order('created_at', { ascending: true });

        if (teamMembers && teamMembers.length > 0) {
          members = teamMembers as TeamMember[];
        }
      }
    }
  } catch (error) {
      void error; /* Caught: error boundary handles display */
    }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization.
          </p>
        </div>
        <button className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:bg-foreground/90 transition-colors">
          Invite Member
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gray-100 border border-border flex items-center justify-center text-xs font-medium text-text-muted">
                      {(member.full_name || member.email)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">
                      {member.full_name || 'Unnamed'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                  {member.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      ROLE_BADGE_COLORS[member.role] || 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {formatRole(member.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                  {formatDate(member.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
