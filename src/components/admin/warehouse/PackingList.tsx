'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Checkbox from '@/components/ui/Checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface PackingItem {
  assetName: string;
  category: string;
  quantity: number;
  status: string;
}

interface PackingListProps {
  items: PackingItem[];
  venueName: string;
  proposalName: string;
}

export default function PackingList({ items, venueName, proposalName }: PackingListProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (checked.size === items.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(items.map((_, i) => i)));
    }
  };

  // Group items by category
  const grouped: Record<string, Array<PackingItem & { originalIndex: number }>> = {};
  items.forEach((item, index) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push({ ...item, originalIndex: index });
  });

  const categories = Object.keys(grouped).sort();
  const allChecked = checked.size === items.length && items.length > 0;

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Packing List</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {proposalName} &mdash; {venueName}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {checked.size}/{items.length} items packed
        </p>
      </div>

      {/* Progress bar */}
      <ProgressBar value={checked.size} max={items.length} color="green" className="mb-4" />

      <div className="overflow-x-auto">
        <Table >
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="text-left py-2 px-2 w-8">
                <Checkbox
                  checked={allChecked}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-left py-2 px-2 text-text-secondary font-medium">Item</TableHead>
              <TableHead className="text-left py-2 px-2 text-text-secondary font-medium">Category</TableHead>
              <TableHead className="text-center py-2 px-2 text-text-secondary font-medium">Qty</TableHead>
              <TableHead className="text-left py-2 px-2 text-text-secondary font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) =>
              grouped[category].map((item) => (
                <TableRow
                  key={item.originalIndex}
                  className={`border-b border-border ${checked.has(item.originalIndex) ? 'bg-success/10' : ''}`}
                >
                  <TableCell className="py-2 px-2">
                    <Checkbox
                      checked={checked.has(item.originalIndex)}
                      onChange={() => toggleItem(item.originalIndex)}
                    />
                  </TableCell>
                  <TableCell className={`py-2 px-2 text-foreground ${checked.has(item.originalIndex) ? 'line-through text-text-muted' : ''}`}>
                    {item.assetName}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-text-secondary">{item.category}</TableCell>
                  <TableCell className="py-2 px-2 text-center text-foreground">{item.quantity}</TableCell>
                  <TableCell className="py-2 px-2">
                    <StatusBadge status={item.status} colorMap={GENERIC_STATUS_COLORS} />
                  </TableCell>
                </TableRow>
              )),
            )}
          </TableBody>
        </Table>
      </div>

      {items.length === 0 && (
        <EmptyState message="No items in packing list" />
      )}
    </Card>
  );
}
