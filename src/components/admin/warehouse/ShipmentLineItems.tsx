'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface LineItem {
  id: string;
  description: string | null;
  quantity: number;
  weight_lbs: number | null;
}

export default function ShipmentLineItems({
  shipmentId,
  items,
}: {
  shipmentId: string;
  items: LineItem[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          quantity,
          weight_lbs: weight ? parseFloat(weight) : null,
        }),
      });

      if (res.ok) {
        setDescription('');
        setQuantity(1);
        setWeight('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Line Items ({items.length})</h3>
      </div>
      
      {/* Add Item Form */}
      <form onSubmit={handleAdd} className="p-4 bg-bg-secondary border-b border-border flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-text-muted mb-1">Description</label>
          <FormInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Item description"
            
            required
          />
        </div>
        <div className="w-24">
          <label className="block text-xs text-text-muted mb-1">Qty</label>
          <FormInput
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            
            required
          />
        </div>
        <div className="w-24">
          <label className="block text-xs text-text-muted mb-1">Weight (lbs)</label>
          <FormInput
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            
            placeholder="-"
          />
        </div>
        <Button type="submit" disabled={loading || !description.trim()}>
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="px-8 py-12 text-center text-sm text-text-secondary">
          No line items added to this shipment.
        </div>
      ) : (
        <Table >
          <TableHeader >
            <TableRow>
              <TableHead className="px-4 py-3">Description</TableHead>
              <TableHead className="px-4 py-3">Qty</TableHead>
              <TableHead className="px-4 py-3">Weight</TableHead>
              <TableHead className="px-4 py-3 w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-bg-secondary/50">
                <TableCell className="px-4 py-3 text-foreground">{item.description ?? '—'}</TableCell>
                <TableCell className="px-4 py-3 tabular-nums">{item.quantity}</TableCell>
                <TableCell className="px-4 py-3 tabular-nums text-text-secondary">
                  {item.weight_lbs ? `${item.weight_lbs} lbs` : '—'}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
