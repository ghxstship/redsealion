'use client';

/**
 * Client-side Projects hub — filterable project list with status badges,
 * and navigation to project detail.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, MapPin, Lock, Globe } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import StatusBadge, { PROJECT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import Tabs from '@/components/ui/Tabs';

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

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, search, statusFilter]);

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <>
      {/* Tabs */}
      <Tabs
        tabs={STATUS_FILTERS.map((s) => ({
          key: s,
          label: s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          count: s === 'all' ? projects.length : projects.filter((p) => p.status === s).length,
        }))}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        className="mb-6"
      />

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
        </div>
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
    </>
  );
}
