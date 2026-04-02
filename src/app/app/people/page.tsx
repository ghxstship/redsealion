import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  department: string | null;
}

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
      .select('id, full_name, email, role, title')
      .eq('organization_id', userData.organization_id)
      .order('full_name');

    return (data ?? []).map((u) => ({
      ...u,
      department: null,
    }));
  } catch {
    return [];
  }
}

export default async function PeoplePage() {
  const members = await getTeamMembers();

  return (
    <TierGate feature="people_hr">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">People</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your team directory and HR information.</p>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total People</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{members.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Departments</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {new Set(members.map((m) => m.department).filter(Boolean)).size || 1}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Roles</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {new Set(members.map((m) => m.role)).size}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No team members found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/app/people/${member.id}`}
              className="group rounded-xl border border-border bg-white px-5 py-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-tertiary">
                  <span className="text-sm font-medium text-text-secondary">
                    {member.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:underline">
                    {member.full_name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {member.title ?? member.role.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-muted truncate">{member.email}</p>
            </Link>
          ))}
        </div>
      )}
    </TierGate>
  );
}
