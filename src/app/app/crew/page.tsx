'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CrewFormModal from '@/components/admin/crew/CrewFormModal';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import { useSelection } from '@/hooks/useSelection';
import { formatLabel } from '@/lib/utils';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface CrewMember {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
  hourly_rate: number | null;
  availability_status: string;
  onboarding_status: string;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  unavailable: 'bg-red-50 text-red-700',
  tentative: 'bg-yellow-50 text-yellow-700',
};

const ONBOARDING_COLORS: Record<string, string> = {
  complete: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  pending: 'bg-gray-100 text-gray-600',
};





export default function CrewPage() {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    async function loadCrew() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: profiles } = await supabase
          .from('crew_profiles')
          .select('*, users(email)')
          .eq('organization_id', ctx.organizationId)
          .order('full_name');

        if (profiles && profiles.length > 0) {
          setCrew(
            profiles.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              full_name: p.full_name as string,
              email: (p.users as Record<string, string>)?.email ?? '',
              skills: (p.skills as string[]) ?? [],
              hourly_rate: p.hourly_rate as number | null,
              availability_status: (p.availability_status as string) ?? 'available',
              onboarding_status: (p.onboarding_status as string) ?? 'pending',
            }))
          );
        }
      } catch (error) {
        void error;
      }
    }
    loadCrew();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return crew;
    const q = search.toLowerCase();
    return crew.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [crew, search]);

  const allIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleDelete(id: string) {
    await fetch(`/api/crew/${id}`, { method: 'DELETE' });
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/crew/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Crew Directory</h1>
          <p className="mt-1 text-sm text-text-secondary">{crew.length} crew members</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          Add Crew Member
        </button>
        <CrewFormModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => router.refresh()} />
      </div>

      {/* Search + Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by name, email, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <DataExportMenu data={filtered} entityKey="crew" filename="crew-export" entityType="Crew" />
        </div>
      </div>

      {/* Bulk bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="crew member"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Crew Members', message: `Delete ${count} crew member(s)? This cannot be undone.` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Skills</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Availability</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Onboarding</th>
              <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((member) => (
              <tr key={member.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(member.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3.5">
                  <input type="checkbox" checked={isSelected(member.id)} onChange={() => toggle(member.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20" />
                </td>
                <td className="px-6 py-3.5">
                  <Link href={`/app/crew/${member.id}`} className="text-sm font-medium text-foreground hover:underline">{member.full_name}</Link>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{member.email}</td>
                <td className="px-6 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">{skill}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{member.hourly_rate != null ? `$${member.hourly_rate}/hr` : '\u2014'}</td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${AVAILABILITY_COLORS[member.availability_status] ?? 'bg-gray-100 text-gray-600'}`}>{formatLabel(member.availability_status)}</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ONBOARDING_COLORS[member.onboarding_status] ?? 'bg-gray-100 text-gray-600'}`}>{formatLabel(member.onboarding_status)}</span>
                </td>
                <td className="px-6 py-3.5">
                  <button onClick={() => setShowDeleteConfirm(member.id)} className="text-text-muted hover:text-red-600 transition-colors" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No crew members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Crew Member" message="Are you sure? This cannot be undone." confirmLabel="Delete" variant="danger" onConfirm={() => handleDelete(showDeleteConfirm)} onCancel={() => setShowDeleteConfirm(null)} />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Crew Members"
        entityKey="crew"
        apiEndpoint="/api/crew"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
