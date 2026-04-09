'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CrewFormModal from '@/components/admin/crew/CrewFormModal';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import { formatLabel } from '@/lib/utils';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { Upload } from 'lucide-react';
import { TierGate } from '@/components/shared/TierGate';


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
  not_started: 'bg-bg-secondary text-text-muted',
  pending: 'bg-bg-secondary text-text-muted',
};

export default function CrewPage() {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
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
          .select('*, users(full_name, email)')
          .eq('organization_id', ctx.organizationId)
          .order('created_at', { ascending: false });

        if (profiles && profiles.length > 0) {
          setCrew(
            profiles.map((p: Record<string, unknown>) => {
              const userRec = p.users as Record<string, string> | null;
              return {
                id: p.id as string,
                full_name: (p.full_name as string) || userRec?.full_name || '',
                email: userRec?.email ?? '',
                skills: (p.skills as string[]) ?? [],
                hourly_rate: p.hourly_rate as number | null,
                availability_status: (p.availability_status as string) ?? (p.availability_default as string) ?? 'available',
                onboarding_status: (p.onboarding_status as string) ?? 'not_started',
              };
            })
          );
        }
      } catch (error) {
        void error;
      }
    }
    loadCrew();
  }, []);

  const filtered = useMemo(() => {
    let result = crew;
    if (availabilityFilter !== 'all') {
      result = result.filter((c) => c.availability_status === availabilityFilter);
    }
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [crew, search, availabilityFilter]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((c) => c.id), [sorted]);
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
    <TierGate feature="crew">
    <>
      {/* Header */}
      <PageHeader
        title="Crew Directory"
        subtitle={`${crew.length} crew members`}
        actionLabel="Add Crew Member"
        renderModal={(props) => <CrewFormModal {...props} />}
        onCreated={() => router.refresh()}
      />


      {/* Availability tabs */}
      <Tabs
        tabs={['all', 'available', 'tentative', 'unavailable'].map((key) => ({
          key,
          label: key === 'all' ? 'All' : formatLabel(key),
          count: key === 'all' ? crew.length : crew.filter((c) => c.availability_status === key).length,
        }))}
        activeTab={availabilityFilter}
        onTabChange={setAvailabilityFilter}
        className="mb-6"
      />

      {/* Search + Import/Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, or skill..."
        />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} />
            Import
          </Button>
          <DataExportMenu data={sorted} entityKey="crew" filename="crew-export" entityType="Crew" />
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
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20" />
              </th>
              <th className="px-6 py-3"><SortableHeader label="Name" field="full_name" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Email" field="email" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Skills</th>
              <th className="px-6 py-3"><SortableHeader label="Rate" field="hourly_rate" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Availability" field="availability_status" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Onboarding" field="onboarding_status" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((member) => (
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
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${AVAILABILITY_COLORS[member.availability_status] ?? 'bg-bg-secondary text-text-muted'}`}>{formatLabel(member.availability_status)}</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ONBOARDING_COLORS[member.onboarding_status] ?? 'bg-bg-secondary text-text-muted'}`}>{formatLabel(member.onboarding_status)}</span>
                </td>
                <td className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/crew/${member.id}`) },
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(member.id) },
                  ]} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
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
    </TierGate>
  );
}
