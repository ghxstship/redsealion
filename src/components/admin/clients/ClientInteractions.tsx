'use client';

import { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import EmptyState from '@/components/ui/EmptyState';

interface Interaction {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  occurred_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  meeting: 'Meeting',
  call: 'Call',
  email: 'Email',
  note: 'Note',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function typeColor(type: string): string {
  const colors: Record<string, string> = {
    meeting: 'bg-blue-50 text-blue-700',
    call: 'bg-green-50 text-green-700',
    email: 'bg-indigo-50 text-indigo-700',
    note: 'bg-gray-100 text-gray-700',
  };
  return colors[type] ?? 'bg-gray-100 text-gray-700';
}

export default function ClientInteractions({
  interactions,
}: {
  interactions: Interaction[];
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered =
    filter === 'all'
      ? interactions
      : interactions.filter((i) => i.type === filter);

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Interactions</h2>
        <div className="flex items-center gap-2">
          <FormSelect
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="meeting">Meetings</option>
            <option value="call">Calls</option>
            <option value="email">Emails</option>
            <option value="note">Notes</option>
          </FormSelect>
          <button className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
            + Add
          </button>
        </div>
      </div>
      <div className="px-6 py-4">
        {filtered.length === 0 ? (
          <EmptyState message="No interactions recorded yet" className="border-0 shadow-none px-2 py-8" />
        ) : (
          <div className="space-y-0">
            {filtered.map((interaction, index) => (
              <div
                key={interaction.id}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                {index < filtered.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-background" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(interaction.type)}`}
                    >
                      {TYPE_ICONS[interaction.type] ?? interaction.type}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDate(interaction.occurred_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {interaction.subject}
                  </p>
                  {interaction.body && (
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                      {interaction.body}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
