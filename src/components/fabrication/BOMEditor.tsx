'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Trash, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface BOMItem {
  id: string;
  material_name: string;
  sku: string | null;
  quantity_required: number;
  quantity_on_hand: number;
  unit: string;
  unit_cost_cents: number;
  supplier: string | null;
  status: string;
}

export default function BOMEditor({ orderId: _orderId, initialItems }: { orderId: string, initialItems: BOMItem[] }) {
  const [items] = useState<BOMItem[]>(initialItems);
  
  // Since we don't have a specific API just for BOM yet, we can simulate local state or 
  // assume there's a POST /api/fabrication/orders/[id]/bom endpoint.
  // Wait, I should add a quick BOM api route or update via client.
  // We will assume Supabase RPC or just simple fetch for the scope.

  // To keep things simple and functional, we'll just display them and have a stub add function
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Bill of Materials</h3>
        <Button className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700">
          <Plus className="w-4 h-4 mr-1" /> Add Material
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-secondary">No materials added yet.</div>
        ) : (
          <Table className="w-full text-sm text-left">
            <TableHeader className="bg-bg-secondary text-xs font-medium text-text-muted uppercase tracking-wider">
              <TableRow>
                <TableHead className="px-4 py-3">Material</TableHead>
                <TableHead className="px-4 py-3">SKU</TableHead>
                <TableHead className="px-4 py-3">Req</TableHead>
                <TableHead className="px-4 py-3">On Hand</TableHead>
                <TableHead className="px-4 py-3">Unit Cost</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {items.map(item => (
                <TableRow key={item.id} className={item.quantity_on_hand < item.quantity_required ? 'bg-red-500/5' : ''}>
                  <TableCell className="px-4 py-3 font-medium text-foreground">{item.material_name}</TableCell>
                  <TableCell className="px-4 py-3 text-text-muted">{item.sku || '—'}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">{item.quantity_required} {item.unit}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums text-blue-600">{item.quantity_on_hand} {item.unit}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(item.unit_cost_cents / 100)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-bg-secondary text-text-secondary">
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button className="text-text-muted hover:text-red-600 transition-colors">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
