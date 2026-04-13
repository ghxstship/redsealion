'use client';

import { useState, useMemo } from 'react';
import { relativeTime } from '@/lib/utils';
import { useSort } from '@/hooks/useSort';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import SortableHeader from '@/components/shared/SortableHeader';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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
  const [search, setSearch] = useState('');
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'audit_logs' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'createdAt', label: 'Time' },
      { key: 'userName', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'entityType', label: 'Entity' },
      { key: 'entityId', label: 'Entity ID' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.action.toLowerCase().includes(q) ||
      e.entityType.toLowerCase().includes(q) ||
      (e.userName && e.userName.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const { sorted, sort, handleSort } = useSort(filtered);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Views & Main Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ViewBar
            views={views}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onCreateView={(opts) => createView({
              name: opts.name,
              display_type: opts.display_type,
              config: opts.inherit ? activeView?.config : {}
            })}
            onDeleteView={deleteView}
            onDuplicateView={duplicateView}
          />
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search audit logs..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                {isVisible('createdAt') && <TableHead className="px-6 py-3"><SortableHeader label="Time" field="createdAt" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('userName') && <TableHead className="px-6 py-3"><SortableHeader label="User" field="userName" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('action') && <TableHead className="px-6 py-3"><SortableHeader label="Action" field="action" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('entityType') && <TableHead className="px-6 py-3"><SortableHeader label="Entity" field="entityType" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('entityId') && <TableHead className="px-6 py-3"><SortableHeader label="Entity ID" field="entityId" currentSort={sort} onSort={handleSort} /></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody >
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                    No audit logs match your search.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((entry) => (
                  <TableRow key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                    {isVisible('createdAt') && (
                      <TableCell className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                        {relativeTime(entry.createdAt)}
                      </TableCell>
                    )}
                    {isVisible('userName') && (
                      <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">
                        {entry.userName ?? 'System'}
                      </TableCell>
                    )}
                    {isVisible('action') && (
                      <TableCell className="px-6 py-3.5 text-sm text-foreground capitalize">
                        {entry.action.replace(/_/g, ' ')}
                      </TableCell>
                    )}
                    {isVisible('entityType') && (
                      <TableCell className="px-6 py-3.5 text-sm text-text-secondary capitalize">
                        {entry.entityType.replace(/_/g, ' ')}
                      </TableCell>
                    )}
                    {isVisible('entityId') && (
                      <TableCell className="px-6 py-3.5 text-xs text-text-muted font-mono">
                        {entry.entityId ? entry.entityId.substring(0, 8) + '...' : '-'}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
    </div>
  );
}
