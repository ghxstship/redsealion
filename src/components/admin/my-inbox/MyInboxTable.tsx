'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import ActiveFilterBadge from '@/components/shared/ActiveFilterBadge';
import { formatLabel } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { SlidersHorizontal, Mail, MailOpen } from 'lucide-react';
import FilterPills from '@/components/ui/FilterPills';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import EmptyState from '@/components/ui/EmptyState';
import { Inbox } from 'lucide-react';

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string | null;
  source_type: string | null;
  source_label: string | null;
  actor_name: string | null;
  read: boolean;
  action_url: string | null;
  priority: string;
  created_at: string;
}

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  comment: 'bg-blue-50 text-blue-700',
  mention: 'bg-purple-50 text-purple-700',
  tag: 'bg-indigo-50 text-indigo-700',
  approval: 'bg-amber-50 text-amber-700',
  system: 'bg-gray-100 text-gray-700',
};

const typeOptions = ['all', 'comment', 'mention', 'tag', 'approval', 'system'] as const;
const readOptions = ['all', 'unread', 'read'] as const;

export default function MyInboxTable({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const {
    views, activeView, activeViewId, setActiveViewId,
    createView, updateView, deleteView, duplicateView,
  } = useEntityViews({ entityType: 'my-inbox' });

  const {
    columns, isVisible, rowHeight, setColumns, setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'type', label: 'Type' },
      { key: 'title', label: 'Title' },
      { key: 'actor_name', label: 'From' },
      { key: 'source_label', label: 'Source' },
      { key: 'priority', label: 'Priority' },
      { key: 'created_at', label: 'Date' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    let result = notifications;
    if (typeFilter !== 'all') result = result.filter((n) => n.type === typeFilter);
    if (readFilter === 'unread') result = result.filter((n) => !n.read);
    if (readFilter === 'read') result = result.filter((n) => n.read);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q) ||
          n.actor_name?.toLowerCase().includes(q) ||
          n.source_label?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [notifications, typeFilter, readFilter, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((n) => n.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll } = useSelection(allIds);

  async function handleBulkRead(ids: string[], read: boolean) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, read }),
    });
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    router.refresh();
  }

  async function handleMarkRead(id: string, read: boolean) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id], read }),
    });
    router.refresh();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4">
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search notifications..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <DataExportMenu data={sorted} entityKey="notifications" filename="inbox-export" entityType="Notifications" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <div className="flex items-center gap-4">
            <FilterPills
              items={[
                { key: 'all' as const, label: 'All', count: notifications.length },
                { key: 'unread' as const, label: 'Unread', count: unreadCount },
                { key: 'read' as const, label: 'Read', count: notifications.length - unreadCount },
              ]}
              activeKey={readFilter}
              onChange={setReadFilter}
            />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <FilterPills
              items={typeOptions.map((key) => ({
                key,
                label: key === 'all' ? 'All Types' : formatLabel(key),
                count: key === 'all' ? notifications.length : notifications.filter((n) => n.type === key).length,
              }))}
              activeKey={typeFilter}
              onChange={setTypeFilter}
            />
            <ActiveFilterBadge
              count={(typeFilter !== 'all' ? 1 : 0) + (readFilter !== 'all' ? 1 : 0)}
              onClearAll={() => { setTypeFilter('all'); setReadFilter('all'); setSearch(''); }}
            />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="notification"
        actions={[
          { label: 'Mark Read', onClick: (ids) => handleBulkRead(ids, true) },
          { label: 'Mark Unread', onClick: (ids) => handleBulkRead(ids, false) },
          {
            label: 'Delete', variant: 'danger',
            confirm: { title: 'Delete Notifications', message: 'Are you sure you want to delete the selected notifications?' },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          message="Inbox zero"
          description="You're all caught up. Notifications from comments, mentions, and system events will appear here."
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                  />
                </th>
                <th className="px-3 py-3 w-8"><span className="sr-only">Read</span></th>
                {isVisible('type') && <th className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('title') && <th className="px-6 py-3"><SortableHeader label="Title" field="title" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('actor_name') && <th className="px-6 py-3"><SortableHeader label="From" field="actor_name" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('source_label') && <th className="px-6 py-3"><SortableHeader label="Source" field="source_label" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('created_at') && <th className="px-6 py-3"><SortableHeader label="Date" field="created_at" currentSort={sort} onSort={handleSort} /></th>}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-16">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((notif) => (
                <tr
                  key={notif.id}
                  className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(notif.id) ? 'bg-blue-50/50' : ''} ${!notif.read ? 'bg-blue-50/20' : ''}`}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected(notif.id)}
                      onChange={() => toggle(notif.id)}
                      className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <button onClick={() => handleMarkRead(notif.id, !notif.read)} title={notif.read ? 'Mark unread' : 'Mark read'}>
                      {notif.read
                        ? <MailOpen size={14} className="text-text-muted" />
                        : <Mail size={14} className="text-blue-600" />}
                    </button>
                  </td>
                  {isVisible('type') && (
                    <td className="px-6 py-3.5">
                      <StatusBadge status={notif.type} colorMap={NOTIFICATION_TYPE_COLORS} />
                    </td>
                  )}
                  {isVisible('title') && (
                    <td className="px-6 py-3.5">
                      <div>
                        <span className={`text-sm ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                          {notif.action_url ? (
                            <a href={notif.action_url} className="hover:underline">{notif.title}</a>
                          ) : notif.title}
                        </span>
                        {notif.message && (
                          <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{notif.message}</p>
                        )}
                      </div>
                    </td>
                  )}
                  {isVisible('actor_name') && (
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{notif.actor_name ?? '\u2014'}</td>
                  )}
                  {isVisible('source_label') && (
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{notif.source_label ?? '\u2014'}</td>
                  )}
                  {isVisible('created_at') && (
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  )}
                  <td className="px-6 py-3.5">
                    <RowActionMenu actions={[
                      { label: notif.read ? 'Mark Unread' : 'Mark Read', onClick: () => handleMarkRead(notif.id, !notif.read) },
                      ...(notif.action_url ? [{ label: 'View Source', onClick: () => router.push(notif.action_url!) }] : []),
                      { label: 'Delete', variant: 'danger' as const, onClick: () => handleBulkDelete([notif.id]) },
                    ]} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && notifications.length > 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">
                    No notifications match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Column Configuration */}
      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
    </>
  );
}
