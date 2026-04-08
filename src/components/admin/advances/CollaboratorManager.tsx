'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { IconPlus, IconUsers } from '@/components/ui/Icons';
import type { AdvanceCollaborator, CollaboratorRole, InviteStatus } from '@/types/database';

const INVITE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
  expired: 'bg-bg-secondary text-text-muted',
  revoked: 'bg-bg-secondary text-text-muted',
};

const COLLAB_ROLE_COLORS: Record<string, string> = {
  owner: 'bg-indigo-50 text-indigo-700',
  manager: 'bg-blue-50 text-blue-700',
  contributor: 'bg-green-50 text-green-700',
  viewer: 'bg-bg-secondary text-text-secondary',
  vendor: 'bg-orange-50 text-orange-700',
};

interface CollaboratorWithUser extends AdvanceCollaborator {
  users?: { full_name: string; email: string } | null;
  organizations?: { name: string } | null;
}

interface CollaboratorManagerProps {
  advanceId: string;
  collaborators: CollaboratorWithUser[];
  onRefresh: () => void;
}

export default function CollaboratorManager({ advanceId, collaborators, onRefresh }: CollaboratorManagerProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('contributor');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/advances/${advanceId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, collaborator_role: role, custom_instructions: instructions || undefined }),
      });
      if (res.ok) {
        setEmail('');
        setInstructions('');
        setShowInvite(false);
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Collaborators</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowInvite(!showInvite)}>
          <IconPlus size={14} /> Invite
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="px-4 py-3 border-b border-border space-y-3 bg-bg-secondary/30">
          <div>
            <FormLabel htmlFor="collab-email">Email address</FormLabel>
            <FormInput id="collab-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collaborator@company.com" required />
          </div>
          <div>
            <FormLabel htmlFor="collab-role">Role</FormLabel>
            <FormSelect id="collab-role" value={role} onChange={(e) => setRole(e.target.value as CollaboratorRole)}>
              <option value="contributor">Contributor</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
              <option value="vendor">Vendor</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel htmlFor="collab-instructions">Instructions (optional)</FormLabel>
            <FormTextarea id="collab-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Special instructions for this collaborator..." rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={loading}>Send Invite</Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowInvite(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* List */}
      {collaborators.length === 0 ? (
        <div className="p-4">
          <EmptyState
            message="No collaborators yet"
            description="Invite contractors and vendors to submit their requirements."
            icon={<IconUsers size={24} />}
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {collaborators.map((c) => (
            <li key={c.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {c.users?.full_name ?? c.organizations?.name ?? c.email ?? 'Unknown'}
                </p>
                {c.users?.email && <p className="text-[11px] text-text-muted">{c.users.email}</p>}
                {c.custom_instructions && <p className="text-[11px] text-text-secondary mt-0.5 italic">{c.custom_instructions}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.collaborator_role} colorMap={COLLAB_ROLE_COLORS} />
                <StatusBadge status={c.invite_status} colorMap={INVITE_STATUS_COLORS} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
