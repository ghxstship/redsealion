'use client';

import { useState, useRef, useEffect } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  type?: 'text' | 'select' | 'date';
  options?: readonly string[] | { value: string; label: string }[];
  renderValue?: (value: string) => React.ReactNode;
  className?: string;
}

/**
 * Double-click-to-edit inline cell component.
 * Supports text input and select dropdown modes.
 */
export default function InlineEditCell({
  value,
  onSave,
  type = 'text',
  options,
  renderValue,
  className = '',
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  async function handleSave() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      setDraft(value); // revert on error
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSave();
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onDoubleClick={() => { setDraft(value); setEditing(true); }}
        className={`inline-block text-left w-full cursor-default hover:bg-blue-50/50 hover:ring-1 hover:ring-blue-200 rounded px-1 -mx-1 transition-all ${className}`}
        title="Double-click to edit"
      >
        {renderValue ? renderValue(value) : value || '\u2014'}
      </button>
    );
  }

  if (type === 'select' && options) {
    return (
      <FormSelect
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={draft}
        onChange={(e) => { setDraft(e.target.value); }}
        onBlur={() => void handleSave()}
      >
        {options.map((opt) => {
          if (typeof opt === 'string') {
            return <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>;
          }
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </FormSelect>
    );
  }

  return (
    <FormInput
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type === 'date' ? 'date' : 'text'}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void handleSave()}
      onKeyDown={handleKeyDown}
      disabled={saving} />
  );
}
