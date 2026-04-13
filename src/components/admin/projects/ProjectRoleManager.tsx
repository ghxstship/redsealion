'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import type { ProjectRole } from '@/lib/permissions';

// ---------------------------------------------------------------------------
// Project Role Management Component
// ---------------------------------------------------------------------------
// Manages project-level role assignments (creator, collaborator, viewer, vendor).
// Used within project detail pages to assign project-scoped roles to org members.
// ---------------------------------------------------------------------------

interface ProjectMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: ProjectRole;
  added_at: string;
}

interface ProjectRoleManagerProps {
  projectId: string;
  organizationId: string;
}

const PROJECT_ROLES: { value: ProjectRole; label: string; description: string }[] = [
  { value: 'creator', label: 'Creator', description: 'Full project control — can manage members, settings, and all content' },
  { value: 'collaborator', label: 'Collaborator', description: 'Can create and edit tasks, upload files, and contribute to the project' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to project data for oversight and review' },
  { value: 'vendor', label: 'Vendor', description: 'External vendor access — can view assigned deliverables and submit work' },
];

const ROLE_COLORS: Record<ProjectRole, string> = {
  creator: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  collaborator: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  viewer: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
  vendor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

export default function ProjectRoleManager({ projectId, organizationId }: ProjectRoleManagerProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<ProjectRole>('collaborator');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch {
      // Silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });

      if (res.ok) {
        setAddEmail('');
        setSuccess('Member added successfully');
        fetchMembers();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to add member');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: ProjectRole) {
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
        );
      }
    } catch {
      // Silent fail
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this member from the project?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Project Members</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Manage who has access to this project and their permissions.
        </p>
      </div>

      {/* Add member form */}
      <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="project-member-email" className="block text-xs font-medium text-text-muted mb-1">
            Email address
          </label>
          <input
            id="project-member-email"
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div className="min-w-[140px]">
          <label htmlFor="project-member-role" className="block text-xs font-medium text-text-muted mb-1">
            Role
          </label>
          <select
            id="project-member-role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as ProjectRole)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PROJECT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Member'}
        </Button>
      </form>

      {/* Feedback */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 rounded-md px-3 py-2">
          {success}
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-bg-secondary animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-sm text-text-muted">
          No members assigned to this project yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-4 py-3 bg-background hover:bg-bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-medium text-text-muted uppercase">
                  {member.full_name?.charAt(0) ?? member.email.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.full_name || member.email}
                  </p>
                  <p className="text-xs text-text-muted truncate">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Role badge / selector */}
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as ProjectRole)}
                  className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${ROLE_COLORS[member.role]}`}
                >
                  {PROJECT_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {/* Remove */}
                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-1 rounded text-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove member"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role legend */}
      <div className="rounded-lg border border-border bg-bg-secondary/50 p-4">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Role Descriptions</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROJECT_ROLES.map((r) => (
            <div key={r.value} className="flex items-start gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 ${ROLE_COLORS[r.value]}`}>
                {r.label}
              </span>
              <span className="text-xs text-text-secondary leading-relaxed">{r.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
