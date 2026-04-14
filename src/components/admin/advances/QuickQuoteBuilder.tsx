'use client';

import React, { useState } from 'react';
import { useQuickQuote } from '@/hooks/useQuickQuote';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function QuickQuoteBuilder() {
  const { quote, generateQuote, loading } = useQuickQuote();
  const [items, setItems] = useState<any[]>([]);
  const [days, setDays] = useState(1);

  // Exposing a basic builder interface
  // In reality, this would have a catalog search tied to it to populate `items`
  
  const handleGenerate = () => {
    // For demo purposes, assumes items have been selected
    generateQuote(items, undefined, days);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Quick Quote Builder</h2>
            <p className="mt-1 text-sm text-text-muted">Draft proposals based on intelligence data</p>
          </div>
          <div className="flex gap-4 items-end">
            <div className="w-20">
              <FormLabel>Days</FormLabel>
              <FormInput
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading || items.length === 0}>
              {loading ? 'Calculating...' : 'Generate Quote'}
            </Button>
          </div>
        </div>
      </Card>

      {quote && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Quote Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Item</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Qty</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Days</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Daily Rate</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Ext Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines.map((line: { item_name: string; quantity: number; days_applied: number; daily_rate_cents: number; line_total_cents: number; }, i: number) => (
                  <TableRow key={i} className="transition-colors duration-fast hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{line.item_name}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">{line.quantity}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">{line.days_applied}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">${(line.daily_rate_cents / 100).toFixed(2)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums font-medium text-foreground">${(line.line_total_cents / 100).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-end">
            <p className="text-lg font-semibold text-foreground tabular-nums">
              Grand Total: ${(quote.total_cents / 100).toFixed(2)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

