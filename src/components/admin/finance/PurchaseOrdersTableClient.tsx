'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Tabs from '@/components/ui/Tabs';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Plus, FileText } from 'lucide-react';

const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  acknowledged: 'bg-indigo-50 text-indigo-700',
  fulfilled: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const STATUS_TAB_KEYS = ['all', 'draft', 'sent', 'acknowledged', 'fulfilled', 'cancelled'] as const;

function formatLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface PoRow {
  id: string;
  poNumber: string;
  vendorName: string;
  description: string | null;
  totalAmount: number;
  status: string;
  issuedDate: string | null;
  dueDate: string | null;
  projectName: string | null;
}

export default function PurchaseOrdersTableClient({ orders }: { orders: PoRow[] }) {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  return (
    <>
      <Tabs
        tabs={STATUS_TAB_KEYS.map((key) => ({
          key,
          label: key === 'all' ? 'All' : formatLabel(key),
          count: key === 'all' ? orders.length : orders.filter((o) => o.status === key).length,
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          message="No purchase orders match this filter"
          description="Try a different status tab or create a new PO."
          action={
            <Button href="/app/finance/purchase-orders/new" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Create PO
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">PO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((po) => (
                  <tr key={po.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{po.poNumber}</td>
                    <td className="px-6 py-3.5 text-sm text-foreground">{po.vendorName}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{po.projectName ?? '—'}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={po.status} colorMap={PO_STATUS_COLORS} />
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {po.dueDate ? new Date(po.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
