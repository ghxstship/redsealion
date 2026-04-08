import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import PersonDetailTabs from './PersonDetailTabs';
import PageHeader from '@/components/shared/PageHeader';

interface PersonDetail {
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  phone: string | null;
  created_at: string;
}

async function getPerson(id: string): Promise<PersonDetail | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('users')
      .select('full_name, email, role, title, phone, created_at')
      .eq('id', id)
      .single();
    return data;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function PersonDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const person = await getPerson(id);

  if (!person) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-8 py-16 text-center">
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

  /* ── Pre-render tab panels ── */

  const profileContent = (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {[
          { label: 'Full Name', value: person.full_name },
          { label: 'Email', value: person.email },
          { label: 'Role', value: formatRole(person.role) },
          { label: 'Title', value: person.title ?? '—' },
          { label: 'Phone', value: person.phone ?? '—' },
          { label: 'Joined', value: formatDate(person.created_at) },
        ].map((field) => (
          <div key={field.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-text-secondary">{field.label}</span>
            <span className="text-sm font-medium text-foreground">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const activityContent = (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-4">
        <div className="relative flex gap-4 pb-4">
          <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
          <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
          <div>
            <p className="text-sm font-medium text-foreground">Account created</p>
            <p className="text-xs text-text-muted mt-0.5">{formatDate(person.created_at)}</p>
          </div>
        </div>
        <div className="relative flex gap-4">
          <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
          <div>
            <p className="text-sm font-medium text-foreground">Assigned role: {formatRole(person.role)}</p>
            <p className="text-xs text-text-muted mt-0.5">{formatDate(person.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const permissionsContent = (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Role & Permissions</h2>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-text-muted">Current Role</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatRole(person.role)}</p>
        </div>
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-text-muted mb-3">Access Level</p>
          <div className="flex flex-wrap gap-2">
            {person.role === 'owner' || person.role === 'admin' ? (
              <>
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Full Access</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Settings</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Team Management</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Billing</span>
              </>
            ) : person.role === 'manager' ? (
              <>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Projects</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Tasks</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Time Tracking</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Reports</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary">Assigned Tasks</span>
                <span className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary">Time Entry</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TierGate feature="people_hr">
      <Link
        href="/app/people"
        className="text-xs font-medium text-text-muted hover:text-foreground transition-colors mb-2 inline-block"
      >
        &larr; People
      </Link>
      <PageHeader
        title={person.full_name}
        subtitle={person.title ?? formatRole(person.role)}
      />

      <PersonDetailTabs
        profileContent={profileContent}
        activityContent={activityContent}
        permissionsContent={permissionsContent}
      />
    </TierGate>
  );
}
