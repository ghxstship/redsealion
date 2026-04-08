'use client';

import { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface BulkReassignModalProps {
  open: boolean;
  onClose: () => void;
  /** IDs of selected entities */
  selectedIds: string[];
  /** Label for confirmation ("task" → "3 tasks") */
  entityLabel: string;
  /** Called with the selected user ID */
  onConfirm: (userId: string) => Promise<void>;
}

/**
 * Modal to pick a team member for bulk reassignment.
 * Fetches org members via /api/settings/team and provides a searchable list.
 */
export default function BulkReassignModal({
  open,
  onClose,
  selectedIds,
  entityLabel,
  onConfirm,
}: BulkReassignModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSelectedMemberId(null);

    async function fetchMembers() {
      setLoading(true);
      try {
        const res = await fetch('/api/settings/team');
        if (res.ok) {
          const json = await res.json();
          setMembers(
            (json.members ?? []).map((u: Record<string, unknown>) => ({
              id: u.id as string,
              full_name: (u.full_name as string) ?? '',
              email: (u.email as string) ?? '',
              avatar_url: (u.avatar_url as string) ?? null,
            })),
          );
        }
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchMembers();
  }, [open]);

  const filtered = search
    ? members.filter(
        (m) =>
          m.full_name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase()),
      )
    : members;

  async function handleConfirm() {
    if (!selectedMemberId) return;
    setSubmitting(true);
    try {
      await onConfirm(selectedMemberId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  const count = selectedIds.length;
  const plural = count === 1 ? entityLabel : `${entityLabel}s`;

  return (
    <ModalShell open={open} onClose={onClose} title="Reassign" subtitle={`Select a team member to assign ${count} ${plural} to.`} size="md">
      <div className="space-y-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search team members..." />

        {/* Member list */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">Loading team members…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">No team members found.</div>
          ) : (
            filtered.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-secondary/50 ${
                  selectedMemberId === member.id
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500'
                    : ''
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary text-xs font-semibold text-text-muted flex-shrink-0">
                  {member.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                  <p className="text-xs text-text-muted truncate">{member.email}</p>
                </div>
                {selectedMemberId === member.id && (
                  <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!selectedMemberId || submitting}
          >
            {submitting ? 'Reassigning…' : `Reassign ${count} ${plural}`}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
