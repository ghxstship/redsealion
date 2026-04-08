'use client';

import { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Button from '@/components/ui/Button';

const DATA_SOURCES = [
  { value: 'proposals', label: 'Proposals' },
  { value: 'deals', label: 'Deals' },
  { value: 'clients', label: 'Clients' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'assets', label: 'Assets' },
  { value: 'team', label: 'Team Members' },
];

const VISUALIZATION_TYPES = [
  { value: 'table', label: 'Table' },
  { value: 'bar_chart', label: 'Bar Chart' },
  { value: 'line_chart', label: 'Line Chart' },
  { value: 'pie_chart', label: 'Pie Chart' },
  { value: 'metric', label: 'Single Metric' },
];

const FIELD_OPTIONS: Record<string, string[]> = {
  proposals: ['name', 'status', 'total_value', 'currency', 'created_at', 'prepared_date'],
  deals: ['title', 'deal_value', 'stage', 'probability', 'expected_close_date', 'created_at'],
  clients: ['company_name', 'industry', 'source', 'created_at'],
  invoices: ['invoice_number', 'type', 'status', 'total', 'amount_paid', 'issue_date', 'due_date', 'paid_date'],
  assets: ['name', 'type', 'category', 'status', 'condition', 'acquisition_cost', 'current_value'],
  team: ['first_name', 'last_name', 'email', 'title'],
};

interface ReportColumn {
  id: string;
  field: string;
  label: string;
  aggregate?: string;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ReportBuilderProps {
  onSave: (config: {
    dataSource: string;
    visualization: string;
    columns: ReportColumn[];
    filters: ReportFilter[];
  }) => void;
}

export function ReportBuilder({ onSave }: ReportBuilderProps) {
  const [dataSource, setDataSource] = useState('proposals');
  const [visualization, setVisualization] = useState('table');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);

  const availableFields = FIELD_OPTIONS[dataSource] ?? [];

  function addColumn() {
    setColumns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: availableFields[0] ?? '', label: availableFields[0] ?? '' },
    ]);
  }

  function removeColumn(id: string) {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  }

  function updateColumn(id: string, updates: Partial<ReportColumn>) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  function addFilter() {
    setFilters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: availableFields[0] ?? '', operator: 'eq', value: '' },
    ]);
  }

  function removeFilter(id: string) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFilter(id: string, updates: Partial<ReportFilter>) {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  return (
    <div className="space-y-6">
      {/* Data source */}
      <div>
        <FormLabel>Data Source</FormLabel>
        <div className="flex flex-wrap gap-2">
          {DATA_SOURCES.map((ds) => (
            <button
              key={ds.value}
              type="button"
              onClick={() => {
                setDataSource(ds.value);
                setColumns([]);
                setFilters([]);
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                dataSource === ds.value
                  ? 'border-foreground bg-bg-secondary text-foreground'
                  : 'border-border bg-background text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {ds.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization type */}
      <div>
        <FormLabel>Visualization</FormLabel>
        <div className="flex flex-wrap gap-2">
          {VISUALIZATION_TYPES.map((vt) => (
            <button
              key={vt.value}
              type="button"
              onClick={() => setVisualization(vt.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                visualization === vt.value
                  ? 'border-foreground bg-bg-secondary text-foreground'
                  : 'border-border bg-background text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {vt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Columns */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FormLabel>Columns</FormLabel>
          <button
            type="button"
            onClick={addColumn}
            className="text-xs font-medium text-foreground hover:opacity-70"
          >
            + Add Column
          </button>
        </div>
        {columns.length === 0 && (
          <p className="text-sm text-text-muted py-3 text-center border border-dashed border-border rounded-lg">
            Add columns to include in the report.
          </p>
        )}
        <div className="space-y-2">
          {columns.map((col) => (
            <div key={col.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <FormSelect
                value={col.field}
                onChange={(e) => updateColumn(col.id, { field: e.target.value, label: e.target.value })}
              >
                {availableFields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </FormSelect>
              <FormInput
                type="text"
                value={col.label}
                onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                placeholder="Label" />
              <FormSelect
                value={col.aggregate ?? ''}
                onChange={(e) => updateColumn(col.id, { aggregate: e.target.value || undefined })}
              >
                <option value="">None</option>
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </FormSelect>
              <button onClick={() => removeColumn(col.id)} className="text-xs text-text-muted hover:text-red-600">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FormLabel>Filters</FormLabel>
          <button
            type="button"
            onClick={addFilter}
            className="text-xs font-medium text-foreground hover:opacity-70"
          >
            + Add Filter
          </button>
        </div>
        {filters.length === 0 && (
          <p className="text-sm text-text-muted py-3 text-center border border-dashed border-border rounded-lg">
            Add filters to narrow the data.
          </p>
        )}
        <div className="space-y-2">
          {filters.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <FormSelect
                value={f.field}
                onChange={(e) => updateFilter(f.id, { field: e.target.value })}
              >
                {availableFields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </FormSelect>
              <FormSelect
                value={f.operator}
                onChange={(e) => updateFilter(f.id, { operator: e.target.value })}
              >
                <option value="eq">Equals</option>
                <option value="neq">Not Equals</option>
                <option value="gt">Greater Than</option>
                <option value="lt">Less Than</option>
                <option value="contains">Contains</option>
              </FormSelect>
              <FormInput
                type="text"
                value={f.value}
                onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                placeholder="Value" />
              <button onClick={() => removeFilter(f.id)} className="text-xs text-text-muted hover:text-red-600">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={() => onSave({ dataSource, visualization, columns, filters })}
          className="transition-opacity"
        >
          Save Report
        </Button>
      </div>
    </div>
  );
}
