import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import PeopleHeader from '@/components/admin/people/PeopleHeader';
import PeopleGrid from '@/components/admin/people/PeopleGrid';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PeopleHubTabs from '../PeopleHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  department: string | null;
  facility: string | null;
  rate_card: string | null;
  avatar_url: string | null;
}

async function getTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role, title, department, facility_id, rate_card, avatar_url')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('full_name');

    return (data ?? []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      title: u.title,
      department: u.department,
      facility: u.facility_id,
      rate_card: u.rate_card,
      avatar_url: u.avatar_url,
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
<PageHeader
        title="People"
        subtitle={`{members.length} team members · {roleCount} {roleCount === 1 ? 'role' : 'roles'}`}
      >
        <PeopleHeader />
      </PageHeader>

      <PeopleHubTabs />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total People</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{members.length}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Roles</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{roleCount}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">With Rate Cards</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{members.filter((m) => m.rate_card).length}</p>
        </Card>
      </div>


      <PeopleGrid members={members} />
    </TierGate>
  );
}
