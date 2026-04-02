'use client';

import { relativeTime } from '@/lib/utils';

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userName: string | null;
  createdAt: string;
}

interface AuditLogTableProps {
  entries: AuditRow[];
}

export default function AuditLogTable({ entries }: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">No audit log entries yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Entity ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                  {relativeTime(entry.createdAt)}
                </td>
                <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                  {entry.userName ?? 'System'}
                </td>
                <td className="px-6 py-3.5 text-sm text-foreground capitalize">
                  {entry.action.replace(/_/g, ' ')}
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary capitalize">
                  {entry.entityType.replace(/_/g, ' ')}
                </td>
                <td className="px-6 py-3.5 text-xs text-text-muted font-mono">
                  {entry.entityId ? entry.entityId.substring(0, 8) + '...' : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
