'use client';

import { useState, type FormEvent } from 'react';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = [
  { value: 'org_admin', label: 'Admin' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'designer', label: 'Designer' },
  { value: 'fabricator', label: 'Fabricator' },
  { value: 'installer', label: 'Installer' },
  { value: 'client_primary', label: 'Client (Primary)' },
  { value: 'client_viewer', label: 'Client (Viewer)' },
] as const;

export default function InviteMemberModal({ open, onClose, onCreated }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('project_manager');
  const [personalMessage, setPersonalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEmail('');
    setRole('project_manager');
    setPersonalMessage('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          personal_message: personalMessage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send invitation');
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-xl animate-modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Invite Team Member</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Personal Message (optional)</label>
            <textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
              placeholder="Hey! I'm inviting you to join our team on FlyteDeck..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
