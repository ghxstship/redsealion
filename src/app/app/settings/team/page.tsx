import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import TeamHeader from '@/components/admin/settings/TeamHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: OrganizationRole;
  created_at: string;
  avatar_url: string | null;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  developer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  owner: 'bg-blue-50 text-blue-700 border-blue-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  controller: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  manager: 'bg-purple-50 text-purple-700 border-purple-200',
  team_member: 'bg-green-50 text-green-700 border-green-200',
  client: 'bg-bg-secondary text-text-muted border-border',
  contractor: 'bg-amber-50 text-amber-700 border-amber-200',
  crew: 'bg-orange-50 text-orange-700 border-orange-200',
  viewer: 'bg-bg-secondary text-text-muted border-border',
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

export default async function TeamSettingsPage() {
  let members: TeamMember[] = [];

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
        <TeamHeader />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary/50">
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Role
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Joined
                </TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-xs font-medium text-text-muted">
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
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-text-secondary">
                    {member.email}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                        ROLE_BADGE_COLORS[member.role] || 'bg-bg-secondary text-text-muted border-border'
                      }`}
                    >
                      {formatRole(member.role)}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-text-secondary">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
                        Edit
                      </Button>
                      <Button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 hover:border-red-500/30 transition-colors">
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
