'use client';

import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { performExport } from '@/lib/export-formats';
import type { EntityField } from '@/lib/entity-fields';

interface ProjectRow {
  id: string;
  name: string;
  clientName: string | null;
  revenue: number;
  totalCosts: number;
  margin: number;
  marginPct: number;
}

const PROFITABILITY_FIELDS: EntityField[] = [
  { key: 'name', label: 'Project', type: 'text' },
  { key: 'clientName', label: 'Client', type: 'text' },
  { key: 'revenue', label: 'Revenue', type: 'currency' },
  { key: 'totalCosts', label: 'Costs', type: 'currency' },
  { key: 'margin', label: 'Margin', type: 'currency' },
  { key: 'marginPct', label: 'Margin %', type: 'number' },
];

export default function ProfitabilityExportButton({ projects }: { projects: ProjectRow[] }) {
  function handleExport() {
    if (projects.length === 0) return;
    performExport('csv', projects, PROFITABILITY_FIELDS, `profitability_${new Date().toISOString().split('T')[0]}`);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={projects.length === 0}>
      <Download size={14} className="mr-1.5" />
      Export CSV
    </Button>
  );
}

