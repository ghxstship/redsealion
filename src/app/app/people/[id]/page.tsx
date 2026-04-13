import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PersonDetailTabs from './PersonDetailTabs';
import PageHeader from '@/components/shared/PageHeader';
import PersonDetailClient from '@/components/admin/people/PersonDetailClient';
import { formatLabel } from '@/lib/utils';

interface PersonDetail {
  id: string;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  phone: string | null;
  department: string | null;
  employment_type: string | null;
  start_date: string | null;
  hourly_cost: number | null;
  facility_id: string | null;
  created_at: string;
}

type PermissionGrant = {
  permissions?: { name?: string | null } | null;
};

type MembershipRole = {
  permission_grants?: PermissionGrant[] | null;
};

type TimeOffBalance = {
  entitled_days: number;
  used_days: number;
  policy?: { name?: string } | null;
};

type AuditEntry = {
  id: string;
  action: string;
  created_at: string;
  actor?: { full_name?: string } | null;
};

async function getPersonData(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;
  
  // 1. Get Person — scoped to current organization
  const { data: person } = await supabase
    .from('users')
    .select('id, full_name, email, role, title, phone, department, employment_type, start_date, hourly_cost, facility_id, avatar_url, created_at, updated_at, organization_id')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!person) return null;

  // 2. Get Audit Log
  const { data: audits } = await supabase
    .from('audit_log')
    .select('id, action, created_at, actor:users!audit_log_user_id_fkey(full_name)')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // 3. Get Memberships & Permissions — scoped to current org
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('roles(name, permission_grants(permissions(name)))')
    .eq('user_id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  let permissions: string[] = [];
  if (membership?.roles && Array.isArray(membership.roles)) {
    // If it returns an array for some reason
    const role = membership.roles[0] as MembershipRole | undefined;
    permissions = role?.permission_grants?.map((grant) => grant.permissions?.name).filter((name): name is string => Boolean(name)) || [];
  } else if (membership?.roles) {
    const role = membership.roles as MembershipRole;
    permissions = role?.permission_grants?.map((grant) => grant.permissions?.name).filter((name): name is string => Boolean(name)) || [];
  }

  // 4. Crew Profile — scoped to current org
  const { data: crew } = await supabase
    .from('crew_profiles')
    .select('id')
    .eq('user_id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  // 5. Time Off Balances
  const { data: balances } = await supabase
    .from('time_off_balances')
    .select('entitled_days, used_days, policy:time_off_policies(name)')
    .eq('user_id', id)
    .eq('year', new Date().getFullYear());

  return { person, audits: audits || [], permissions, hasCrewProfile: !!crew, balances: balances || [] };
}

function formatDateStr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// #36: Use canonical formatLabel from @/lib/utils instead of local formatRole

export default async function PersonDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const data = await getPersonData(id);

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Person not found.</p>
        <Link
          href="/app/people"
          className="mt-3 inline-block text-sm font-medium text-foreground hover:underline"
        >
          &larr; Back to People
        </Link>
      </div>
    );
  }

  const { person, audits, permissions, hasCrewProfile, balances } = data;
  const timeOffBalances = balances as TimeOffBalance[];
  const activityAudits = audits as AuditEntry[];

  /* ── Pre-render tab panels ── */

  const profileContent = (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-background divide-y divide-border">
        {[
          { label: 'Full Name', value: person.full_name },
          { label: 'Email', value: person.email },
          { label: 'Role', value: formatLabel(person.role) },
          { label: 'Title', value: person.title ?? '—' },
          { label: 'Phone', value: person.phone ?? '—' },
          { label: 'Department', value: person.department ?? '—' },
          { label: 'Employment Type', value: person.employment_type ? formatLabel(person.employment_type) : '—' },
          { label: 'Joined', value: formatDateStr(person.created_at) },
        ].map((field) => (
          <div key={field.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-text-secondary">{field.label}</span>
            <span className="text-sm font-medium text-foreground">{field.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {hasCrewProfile && (
          <div className="rounded-xl border border-border bg-background p-5 hover:border-primary transition-colors">
            <Link href={`/app/crew/${person.id}`}>
              <h3 className="text-sm font-semibold text-foreground mb-1">Crew Profile &rarr;</h3>
              <p className="text-xs text-text-muted">View skills, rates, and schedule.</p>
            </Link>
          </div>
        )}
        {timeOffBalances.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-5 col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Time Off Balances ({new Date().getFullYear()})</h3>
            <div className="grid grid-cols-3 gap-4">
              {timeOffBalances.map((b, i) => (
                <div key={i} className="p-3 bg-bg-secondary rounded-lg">
                  <p className="text-xs text-text-secondary mb-1 truncate">{b.policy?.name || 'Unknown'}</p>
                  <p className="text-lg font-semibold text-foreground">{b.entitled_days - b.used_days} <span className="text-xs font-normal text-text-muted">days left</span></p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const activityContent = (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activityAudits.length === 0 ? (
          <p className="text-sm text-text-muted">No recent activity.</p>
        ) : (
          activityAudits.map((audit, index) => (
            <div key={audit.id} className={`relative flex gap-4 ${index !== activityAudits.length - 1 ? 'pb-4' : ''}`}>
              {index !== activityAudits.length - 1 && <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />}
              <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-background" />
              <div>
                <p className="text-sm font-medium text-foreground">{formatLabel(audit.action.replace(/\./g, ' '))} by {audit.actor?.full_name || 'System'}</p>
                <p className="text-xs text-text-muted mt-0.5">{formatDateStr(audit.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const permissionsContent = (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Role & Permissions</h2>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-muted">Current Role</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatLabel(person.role)}</p>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-text-muted mb-3">Access Level</p>
          <div className="flex flex-wrap gap-2">
            {permissions.length === 0 ? (
              <span className="text-xs text-text-muted">Using default legacy role grants.</span>
            ) : (permissions.map((p: string) => (
              <span key={p} className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] uppercase tracking-wider font-medium text-blue-700">
                {p}
              </span>
            )))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TierGate feature="people_hr">
      <nav className="flex text-xs font-medium text-text-muted mb-4" aria-label="Breadcrumb">
        <Link href="/app/people" className="hover:text-foreground transition-colors">People</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{person.full_name}</span>
      </nav>
      
      <PageHeader
        title={person.full_name}
        subtitle={person.title ?? formatLabel(person.role)}
      />

      <PersonDetailClient person={person} />

      <PersonDetailTabs
        profileContent={profileContent}
        activityContent={activityContent}
        permissionsContent={permissionsContent}
      />
    </TierGate>
  );
}
