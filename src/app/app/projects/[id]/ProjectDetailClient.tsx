'use client';

/**
 * Project detail view — tabbed interface for project settings,
 * members, portals, and status updates.
 * Addresses GAP-P02, GAP-P19 (archive), GAP-P20 (membership management).
 */

import { useState } from 'react';
import { ArrowLeft, Archive, Users, Settings, Shield, Activity } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/shared/PageHeader';
import { PortalSettingsCard } from '@/components/admin/portfolio/PortalSettingsCard';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import StatusBadge, { PROJECT_STATUS_COLORS, GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';

interface Member {
  id: string;
  user_id: string;
  seat_type: string;
  status: string;
  created_at: string;
  users: { full_name: string; email: string; avatar_url: string | null } | null;
}

interface Portal {
  id: string;
  portal_type: string;
  is_published: boolean;
  updated_at: string;
}

interface StatusUpdate {
  id: string;
  status: string;
  summary: string;
  created_at: string;
  created_by: string | null;
}

interface ProjectDetailProps {
  project: Record<string, unknown> & {
    id: string;
    name: string;
    slug: string;
    status: string;
    visibility: string;
    description?: string | null;
    venue_name?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    project_code?: string | null;
    members: Member[];
    portals: Portal[];
    statusUpdates: StatusUpdate[];
  };
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'portals', label: 'Portals', icon: Shield },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  on_track: 'bg-green-50 text-green-700',
  at_risk: 'bg-amber-50 text-amber-700',
  off_track: 'bg-red-50 text-red-700',
  completed: 'bg-blue-50 text-blue-700',
};

const SEAT_LABELS: Record<string, string> = {
  project_admin: 'Admin',
  project_manager: 'Manager',
  project_member: 'Member',
  project_viewer: 'Viewer',
  project_guest: 'Guest',
};

export default function ProjectDetailClient({ project }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  async function handleArchive() {
    setShowArchiveConfirm(false);
    setIsArchiving(true);
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      window.location.href = '/app/projects';
    } catch { /* silent */ }
    finally { setIsArchiving(false); }
  }

  return (
    <>
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link href="/app/projects" className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-foreground mb-3">
          <ArrowLeft size={12} /> Back to Projects
        </Link>
        <PageHeader title={project.name}>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} colorMap={PROJECT_STATUS_COLORS} />
          </div>
        </PageHeader>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab.key === activeTab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-text-muted hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.key === 'members' && <span className="ml-1 text-[10px] opacity-60">{project.members.length}</span>}
              {tab.key === 'portals' && <span className="ml-1 text-[10px] opacity-60">{project.portals.filter(p => p.is_published).length}</span>}
            </Button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Project info cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                {project.project_code && <div className="flex justify-between"><dt className="text-text-muted">Code</dt><dd className="font-mono text-foreground">{project.project_code}</dd></div>}
                <div className="flex justify-between"><dt className="text-text-muted">Visibility</dt><dd className="text-foreground capitalize">{project.visibility}</dd></div>
                {project.venue_name && <div className="flex justify-between"><dt className="text-text-muted">Venue</dt><dd className="text-foreground">{project.venue_name}</dd></div>}
                {project.starts_at && <div className="flex justify-between"><dt className="text-text-muted">Start</dt><dd className="text-foreground tabular-nums">{new Date(project.starts_at).toLocaleDateString()}</dd></div>}
                {project.ends_at && <div className="flex justify-between"><dt className="text-text-muted">End</dt><dd className="text-foreground tabular-nums">{new Date(project.ends_at).toLocaleDateString()}</dd></div>}
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Team</h3>
              <div className="space-y-2">
                {project.members.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-bg-secondary flex items-center justify-center text-[10px] font-semibold text-text-muted">
                      {m.users?.full_name?.charAt(0) ?? '?'}
                    </div>
                    <span className="text-foreground flex-1 truncate">{m.users?.full_name ?? 'Unknown'}</span>
                    <span className="text-[10px] text-text-muted">{SEAT_LABELS[m.seat_type] ?? m.seat_type}</span>
                  </div>
                ))}
                {project.members.length === 0 && <p className="text-xs text-text-muted italic">No members yet</p>}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Portals</h3>
              <div className="space-y-2">
                {project.portals.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground capitalize">{p.portal_type.replace(/_/g, ' ')}</span>
                    <StatusBadge status={p.is_published ? 'published' : 'draft'} colorMap={{published: 'bg-green-100 text-green-700', draft: 'bg-gray-100 text-gray-500'}} />
                  </div>
                ))}
                {project.portals.length === 0 && <p className="text-xs text-text-muted italic">No portals configured</p>}
              </div>
            </div>
          </div>

          {/* Status Updates */}
          {project.statusUpdates.length > 0 && (
            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Recent Updates</h3>
              <div className="space-y-3">
                {project.statusUpdates.map((u) => (
                  <div key={u.id} className="border-l-2 border-border pl-3">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={u.status} colorMap={STATUS_COLORS} />
                      <span className="text-[10px] text-text-muted">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{u.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="rounded-xl border border-border bg-background">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Project Members</h3>
          </div>
          <div className="divide-y divide-border">
            {project.members.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-text-muted">No members assigned to this project yet.</div>
            ) : (
              project.members.map((m) => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-semibold text-text-muted">
                    {m.users?.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.users?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-text-muted truncate">{m.users?.email}</p>
                  </div>
                  <span className="rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {SEAT_LABELS[m.seat_type] ?? m.seat_type}
                  </span>
                  <StatusBadge status={m.status} colorMap={GENERIC_STATUS_COLORS} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'portals' && (
        <PortalSettingsCard projectId={project.id} />
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Project Settings</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Slug</dt><dd className="font-mono text-foreground">{project.slug}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd className="text-foreground capitalize">{project.status}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Visibility</dt><dd className="text-foreground capitalize">{project.visibility}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Created</dt><dd className="text-foreground tabular-nums">{new Date('created_at' in project ? (project.created_at as string) : '').toLocaleDateString()}</dd></div>
            </dl>
          </div>

          {/* Danger zone — GAP-P19 Archive */}
          <Alert variant="warning">
            <h3 className="text-sm font-semibold mb-2">Danger Zone</h3>
            <p className="text-sm mb-4">
              Archiving this project will soft-delete it and remove it from all active views. This can be undone by an administrator.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowArchiveConfirm(true)}
              loading={isArchiving}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Archive size={14} className="mr-1" /> Archive Project
            </Button>
          </Alert>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={showArchiveConfirm}
      title="Archive Project"
      message="Are you sure you want to archive this project? It can be restored later by an administrator."
      variant="danger"
      confirmLabel="Archive"
      onConfirm={handleArchive}
      onCancel={() => setShowArchiveConfirm(false)}
    />
    </>
  );
}
