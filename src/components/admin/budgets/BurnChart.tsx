'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface BurnChartProps {
  totalBudget: number;
  spent: number;
  proposalId?: string;
}

interface MonthlyBurn {
  month: string;
  amount: number;
}

export default function BurnChart({ totalBudget, spent, proposalId }: BurnChartProps) {
  const remaining = totalBudget - spent;
  const percentUsed = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  const [monthlySpend, setMonthlySpend] = useState<MonthlyBurn[]>([]);

  useEffect(() => {
    async function loadBurnData() {
      if (!proposalId) {
        // Fallback: distribute `spent` evenly across 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const perMonth = spent > 0 ? Math.round(spent / months.length) : 0;
        setMonthlySpend(months.map((m, i) => ({
          month: m,
          amount: i < months.length - 1 ? perMonth : spent - perMonth * (months.length - 1),
        })));
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Fetch expenses grouped by month for this proposal
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, date')
          .eq('proposal_id', proposalId)
          .order('date', { ascending: true });

        if (!expenses || expenses.length === 0) {
          // No expenses — show even distribution of spent amount
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          const perMonth = spent > 0 ? Math.round(spent / months.length) : 0;
          setMonthlySpend(months.map((m, i) => ({
            month: m,
            amount: i < months.length - 1 ? perMonth : spent - perMonth * (months.length - 1),
          })));
          return;
        }

        // Group expenses by month
        const monthMap = new Map<string, number>();
        for (const exp of expenses) {
          const d = new Date(exp.date);
          const key = d.toLocaleString('en-US', { month: 'short' });
          monthMap.set(key, (monthMap.get(key) ?? 0) + exp.amount);
        }

        // Build cumulative monthly series
        let cumulative = 0;
        const result: MonthlyBurn[] = [];
        for (const [month, amount] of monthMap) {
          cumulative += amount;
          result.push({ month, amount: cumulative });
        }

        setMonthlySpend(result);
      } catch {
        // Fallback on error
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const perMonth = spent > 0 ? Math.round(spent / months.length) : 0;
        setMonthlySpend(months.map((m, i) => ({
          month: m,
          amount: i < months.length - 1 ? perMonth : spent - perMonth * (months.length - 1),
        })));
      }
    }
    loadBurnData();
  }, [proposalId, spent]);

  const maxSpend = Math.max(...monthlySpend.map((m) => m.amount), totalBudget, 1);

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Budget Burn-Down</h2>
        <p className="text-xs text-text-secondary mt-1">
          {formatCurrency(remaining)} remaining of {formatCurrency(totalBudget)} total budget
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Simple bar chart */}
        <div className="flex items-end gap-3 h-40">
          {monthlySpend.map((m) => {
            const height = maxSpend > 0 ? (m.amount / maxSpend) * 100 : 0;
            const overBudget = m.amount > totalBudget;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-text-muted">
                  {formatCurrency(m.amount)}
                </span>
                <div className="w-full relative" style={{ height: '120px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-[width,height,opacity] ${
                      overBudget ? 'bg-red-400' : 'bg-foreground/80'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">{m.month}</span>
              </div>
            );
          })}
        </div>

        {/* Budget line indicator */}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-foreground/80" />
            <span>Cumulative spend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-6 border-t-2 border-dashed border-red-400" />
            <span>Budget limit ({formatCurrency(totalBudget)})</span>
          </div>
          <span className="ml-auto font-medium">{percentUsed}% consumed</span>
        </div>
      </div>
    </div>
  );
}
