import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import PeopleHeader from '@/components/admin/people/PeopleHeader';
import PeopleGrid from '@/components/admin/people/PeopleGrid';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PeopleHubTabs from '../PeopleHubTabs';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  facility: string | null;
  rate_card: string | null;
}

async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role, title, facility_id, rate_card')
      .eq('organization_id', ctx.organizationId)
      .order('full_name');

    return (data ?? []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      title: u.title,
      facility: u.facility_id,
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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">People</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {members.length} team members &middot; {roleCount} {roleCount === 1 ? 'role' : 'roles'}
          </p>
        </div>
        <PeopleHeader />
      </div>

      <PeopleHubTabs />

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
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{members.filter((m) => m.rate_card).length}</p>
        </div>
      </div>


      <PeopleGrid members={members} />
    </TierGate>
  );
}
