'use client';

/**
 * Guest collaborator invite — add external collaborators to tasks.
 *
 * @module components/admin/tasks/GuestCollaborators
 */

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import { UserPlus, Mail, X } from 'lucide-react';

interface GuestCollaborator {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invited_at: string;
}

interface GuestCollaboratorsProps {
  taskId: string;
}

export default function GuestCollaborators({ taskId }: GuestCollaboratorsProps) {
  const [guests, setGuests] = useState<GuestCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/guests`);
      if (res.ok) {
        const data = await res.json();
        setGuests(data.guests ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  async function handleInvite() {
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        setEmail('');
        setRole('viewer');
        setShowInvite(false);
        await fetchGuests();
      }
    } catch { /* silent */ } finally {
      setInviting(false);
    }
  }

  async function handleRemove(guestId: string) {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    try {
      await fetch(`/api/tasks/${taskId}/guests/${guestId}`, { method: 'DELETE' });
    } catch {
      await fetchGuests();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <UserPlus size={14} className="text-text-muted" />
          Guest Collaborators
        </h3>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
        >
          {showInvite ? 'Cancel' : '+ Invite'}
        </button>
      </div>

      {showInvite && (
        <div className="rounded-lg border border-border bg-bg-secondary/30 p-3 space-y-2">
          <FormInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collaborator@example.com"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <FormSelect
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex-1"
            >
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
            </FormSelect>
            <Button size="sm" onClick={handleInvite} loading={inviting} disabled={!email.trim()}>
              Invite
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-text-muted text-center py-3">Loading…</p>
      ) : guests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary/30 px-4 py-4 text-center">
          <p className="text-xs text-text-muted">
            No guest collaborators. Invite external stakeholders to view or comment.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background divide-y divide-border overflow-hidden">
          {guests.map((guest) => (
            <div key={guest.id} className="flex items-center gap-2 px-3 py-2.5 group">
              <Mail size={14} className="text-text-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {guest.name ?? guest.email}
                </p>
                {guest.name && (
                  <p className="text-[11px] text-text-muted">{guest.email}</p>
                )}
              </div>
              <span className="text-[11px] text-text-muted capitalize">{guest.role}</span>
              <button
                onClick={() => handleRemove(guest.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-600 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
