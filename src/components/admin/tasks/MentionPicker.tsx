'use client';

/**
 * @mention autocomplete picker for task comments.
 *
 * Triggers when user types `@` in a textarea, showing a dropdown
 * of org members to insert.
 *
 * @module components/admin/tasks/MentionPicker
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';

interface Member {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface MentionPickerProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onSelect: (mention: string) => void;
}

export default function MentionPicker({ inputRef, onSelect }: MentionPickerProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [selected, setSelected] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Load org members once
  useEffect(() => {
    async function loadMembers() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;
        const supabase = createClient();
        const { data } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('organization_id', ctx.organizationId)
          .order('full_name');
        setMembers(data ?? []);
      } catch { /* silent */ }
    }
    loadMembers();
  }, []);

  // Filter members by query
  useEffect(() => {
    if (!query) {
      setFiltered(members.slice(0, 8));
    } else {
      const q = query.toLowerCase();
      setFiltered(
        members
          .filter((m) => m.full_name.toLowerCase().includes(q))
          .slice(0, 8),
      );
    }
    setSelected(0);
  }, [query, members]);

  // Listen for @ trigger in textarea
  const handleInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const val = el.value;
    const pos = el.selectionStart ?? 0;

    // Find the last @ before cursor
    const before = val.substring(0, pos);
    const atIdx = before.lastIndexOf('@');

    if (atIdx >= 0 && (atIdx === 0 || /\s/.test(before[atIdx - 1]))) {
      const q = before.substring(atIdx + 1);
      if (!/\s/.test(q)) {
        setQuery(q);
        setVisible(true);
        return;
      }
    }

    setVisible(false);
  }, [inputRef]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.addEventListener('input', handleInput);
    el.addEventListener('click', handleInput);
    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('click', handleInput);
    };
  }, [inputRef, handleInput]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        selectMember(filtered[selected]);
      } else if (e.key === 'Escape') {
        setVisible(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, selected, filtered]);

  function selectMember(member: Member) {
    const el = inputRef.current;
    if (!el) return;

    const val = el.value;
    const pos = el.selectionStart ?? 0;
    const before = val.substring(0, pos);
    const atIdx = before.lastIndexOf('@');

    const newVal =
      val.substring(0, atIdx) +
      `@${member.full_name} ` +
      val.substring(pos);

    onSelect(newVal);
    setVisible(false);

    // Restore focus
    setTimeout(() => {
      el.focus();
      const newPos = atIdx + member.full_name.length + 2;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  }

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute left-0 right-0 bottom-full mb-1 rounded-lg border border-border bg-white shadow-lg z-50 max-h-48 overflow-y-auto"
    >
      {filtered.map((member, idx) => (
        <button
          key={member.id}
          onClick={() => selectMember(member)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
            idx === selected ? 'bg-bg-secondary' : 'hover:bg-bg-secondary/50'
          }`}
        >
          {member.avatar_url ? (
            <img src={member.avatar_url} alt="" className="h-5 w-5 rounded-full" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-medium text-text-muted">
              {member.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-foreground">{member.full_name}</span>
        </button>
      ))}
    </div>
  );
}
