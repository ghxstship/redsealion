'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import ExportButton from '@/components/shared/ExportButton';
import ImportDialog from '@/components/shared/ImportDialog';

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

const EXPORT_COLUMNS = [
  { key: 'full_name' as const, label: 'Name' },
  { key: 'email' as const, label: 'Email' },
  { key: 'role' as const, label: 'Role' },
  { key: 'title' as const, label: 'Title' },
  { key: 'rate_card' as const, label: 'Rate Card' },
];

const IMPORT_FIELDS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'role', label: 'Role' },
  { key: 'title', label: 'Title' },
];

export default function PeopleGrid({ members }: { members: TeamMember[] }) {
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, search]);

  return (
    <>
      {/* Search + Export */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search people by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <ExportButton data={filtered} columns={EXPORT_COLUMNS} filename="people-export" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
              <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">{search ? 'No results found' : 'No team members yet'}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {search ? 'Try a different search term.' : 'Invite your first team member to start collaborating.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Link
              key={member.id}
              href={`/app/people/${member.id}`}
              className="group rounded-xl border border-border bg-white px-6 py-5 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-tertiary">
                  <span className="text-sm font-semibold text-text-secondary">{getInitials(member.full_name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:underline">{member.full_name}</p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">{member.title ?? member.role.replace(/_/g, ' ')}</p>
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
                  <span className="text-xs font-medium text-foreground tabular-nums">{member.rate_card ?? '\u2014'}</span>
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

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="People"
        targetFields={IMPORT_FIELDS}
        apiEndpoint="/api/settings/team"
      />
    </>
  );
}
