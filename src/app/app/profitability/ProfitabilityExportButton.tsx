'use client';

import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';

interface ProjectRow {
  id: string;
  name: string;
  clientName: string | null;
  revenue: number;
  totalCosts: number;
  margin: number;
  marginPct: number;
}

export default function ProfitabilityExportButton({ projects }: { projects: ProjectRow[] }) {
  function handleExport() {
    if (projects.length === 0) return;

    const headers = ['Project', 'Client', 'Revenue', 'Costs', 'Margin', 'Margin %'];
    const rows = projects.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.clientName ?? '—').replace(/"/g, '""')}"`,
      p.revenue.toFixed(2),
      p.totalCosts.toFixed(2),
      p.margin.toFixed(2),
      `${p.marginPct}%`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profitability_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={projects.length === 0}>
      <Download size={14} className="mr-1.5" />
      Export CSV
    </Button>
  );
}
