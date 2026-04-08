'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import PersonEditModal from './PersonEditModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { Edit, Eye, FolderHeart, Mail, Users2, Shield, MoreVertical, Trash2 } from 'lucide-react';
import type { Database } from '@/types/database';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

import { ROLE_BADGE_COLORS } from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Upload } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import ViewBar from '@/components/shared/ViewBar';

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
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  controller: 'Controller',
  manager: 'Manager',
  team_member: 'Team Member',
  client: 'Client',
  contractor: 'Contractor',
  crew: 'Crew',
  viewer: 'Viewer',
};

export default function PeopleGrid({ members }: { members: TeamMember[] }) {
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [editPerson, setEditPerson] = useState<TeamMember | null>(null);
  const [deletePerson, setDeletePerson] = useState<TeamMember | null>(null);
  const router = useRouter();

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'people' });

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

  async function handleDeletePerson(person: TeamMember) {
    const res = await fetch(`/api/settings/team/${person.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Failed to remove team member');
      return;
    }
    setDeletePerson(null);
    router.refresh();
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Views & Main Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ViewBar
            views={views}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onCreateView={(opts) => createView({
              name: opts.name,
              display_type: opts.display_type,
              config: opts.inherit ? activeView?.config : {}
            })}
            onDeleteView={deleteView}
            onDuplicateView={duplicateView}
          />
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search people..."
            />
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={filtered} entityKey="people" filename="people-export" entityType="People" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={search ? 'No results found' : 'No team members yet'}
          description={search ? 'Try a different search term.' : 'Invite your first team member to start collaborating.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="group relative rounded-xl border border-border bg-background px-6 py-5 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Action menu */}
              <div className="absolute top-3 right-3">
                <RowActionMenu actions={[
                  { label: 'View', onClick: () => router.push(`/app/people/${member.id}`) },
                  { label: 'Edit', onClick: () => setEditPerson(member) },
                  { label: 'Remove', variant: 'danger', onClick: () => setDeletePerson(member) },
                ]} />
              </div>

              <Link href={`/app/people/${member.id}`}>
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[member.role] ?? 'bg-bg-secondary text-gray-700'}`}>
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
            </div>
          ))}
        </div>
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="People"
        entityKey="people"
        apiEndpoint="/api/settings/team"
        onComplete={() => router.refresh()}
      />

      {editPerson && (
        <PersonEditModal
          open
          person={editPerson}
          onClose={() => setEditPerson(null)}
          onSaved={() => { setEditPerson(null); router.refresh(); }}
        />
      )}

      {deletePerson && (
        <ConfirmDialog
          open
          title="Remove Team Member"
          message={`Are you sure you want to remove ${deletePerson.full_name} from the organization? They will lose access to all resources.`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => handleDeletePerson(deletePerson)}
          onCancel={() => setDeletePerson(null)}
        />
      )}
    </>
  );
}
