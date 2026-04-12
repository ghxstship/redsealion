'use client';

/**
 * Client-side Projects hub — filterable project list with status badges,
 * create modal, and navigation to project detail.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Calendar, MapPin, Lock, Globe } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import StatusBadge, { PROJECT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Link from 'next/link';

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  venue_name: string | null;
  project_code: string | null;
}



const STATUS_FILTERS = ['all', 'active', 'in_progress', 'draft', 'on_hold', 'completed', 'archived'];

export default function ProjectsHubClient({ projects: initialProjects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const projects = initialProjects;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newVisibility, setNewVisibility] = useState('private');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, search, statusFilter]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          status: newStatus,
          visibility: newVisibility,
        }),
      });
      if (res.ok) {
        setNewName('');
        setShowCreate(false);
        router.refresh();
      }
    } catch { /* silent */ }
    finally { setCreating(false); }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <FormInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  s === statusFilter
                    ? 'bg-foreground text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} className="mr-1" /> New Project
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <Link
            key={project.id}
            href={`/app/projects/${project.id}`}
            className="group rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                {project.project_code && (
                  <p className="text-[11px] text-text-muted font-mono mt-0.5">{project.project_code}</p>
                )}
              </div>
              <StatusBadge status={project.status} colorMap={PROJECT_STATUS_COLORS} className="shrink-0" />
            </div>

            <div className="space-y-1.5 text-xs text-text-muted">
              {project.venue_name && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{project.venue_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="shrink-0" />
                <span>
                  {project.starts_at
                    ? `${formatDate(project.starts_at)}${project.ends_at ? ` — ${formatDate(project.ends_at)}` : ''}`
                    : `Created ${formatDate(project.created_at)}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {project.visibility === 'public' ? (
                  <><Globe size={12} className="shrink-0" /><span>Public</span></>
                ) : (
                  <><Lock size={12} className="shrink-0" /><span>Private</span></>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-background px-8 py-12 text-center">
          <p className="text-sm text-text-secondary">
            {search ? 'No projects match your search.' : 'No projects with this status.'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      <ModalShell open={showCreate} onClose={() => setShowCreate(false)} title="New Project">
        <div className="space-y-4">
          <div>
            <FormLabel>Project Name</FormLabel>
            <FormInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Ultra Music Festival 2026"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Visibility</FormLabel>
              <FormSelect value={newVisibility} onChange={(e) => setNewVisibility(e.target.value)}>
                <option value="private">Private</option>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
              </FormSelect>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
              Create Project
            </Button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
