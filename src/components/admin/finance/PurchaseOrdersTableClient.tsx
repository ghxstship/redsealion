'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Tabs from '@/components/ui/Tabs';
import StatusBadge, { PURCHASE_ORDER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Plus, FileText } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';



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
            <Table >
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">PO #</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Vendor</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {filtered.map((po) => (
                  <TableRow key={po.id} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{po.poNumber}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-foreground">{po.vendorName}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{po.projectName ?? '—'}</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <StatusBadge status={po.status} colorMap={PURCHASE_ORDER_STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(po.totalAmount)}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                      {po.dueDate ? new Date(po.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
}
