/**
 * Report executor — runs a custom report's query_config against the database
 * and returns results as an array of rows or a CSV string.
 *
 * Supported data sources: proposals, deals, clients, invoices, assets, team
 * Mirrors the ReportBuilder component's DATA_SOURCES and FIELD_OPTIONS.
 *
 * @module lib/reports/executor
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface QueryConfig {
  dataSource: string;
  visualization?: string;
  columns: Array<{ id: string; field: string; label: string; aggregate?: string }>;
  filters: Array<{ id: string; field: string; operator: string; value: string }>;
}

export interface ReportRow {
  [key: string]: unknown;
}

/* ─────────────────────────────────────────────────────────
   Data source → table mapping
   ───────────────────────────────────────────────────────── */

const SOURCE_TABLE_MAP: Record<string, string> = {
  proposals: 'proposals',
  deals: 'deals',
  clients: 'clients',
  invoices: 'invoices',
  assets: 'assets',
  team: 'users',
};

/** Allowed fields per data source — prevents arbitrary column access */
const ALLOWED_FIELDS: Record<string, Set<string>> = {
  proposals: new Set(['name', 'status', 'total_value', 'currency', 'created_at', 'prepared_date']),
  deals: new Set(['title', 'deal_value', 'stage', 'probability', 'expected_close_date', 'created_at']),
  clients: new Set(['company_name', 'industry', 'source', 'created_at']),
  invoices: new Set(['invoice_number', 'type', 'status', 'total', 'amount_paid', 'issue_date', 'due_date', 'paid_date']),
  assets: new Set(['name', 'type', 'category', 'status', 'condition', 'acquisition_cost', 'current_value']),
  team: new Set(['first_name', 'last_name', 'email', 'title']),
};

/* ─────────────────────────────────────────────────────────
   Executor
   ───────────────────────────────────────────────────────── */

/**
 * Execute a report query against the database.
 * Uses org scoping to ensure data isolation.
 */
export async function executeReport(
  supabase: SupabaseClient,
  organizationId: string,
  config: QueryConfig,
): Promise<ReportRow[]> {
  const tableName = SOURCE_TABLE_MAP[config.dataSource];
  if (!tableName) throw new Error(`Unknown data source: ${config.dataSource}`);

  const allowedFields = ALLOWED_FIELDS[config.dataSource];
  if (!allowedFields) throw new Error(`No field definitions for: ${config.dataSource}`);

  // Build select columns — only allow whitelisted fields
  const selectFields = config.columns.length > 0
    ? config.columns
        .filter((c) => allowedFields.has(c.field))
        .map((c) => c.field)
    : Array.from(allowedFields);

  // De-duplicate
  const uniqueFields = [...new Set(selectFields)];
  if (uniqueFields.length === 0) {
    uniqueFields.push(...Array.from(allowedFields).slice(0, 5));
  }

  // Build query
  let query = supabase.from(tableName).select(uniqueFields.join(', '));

  // Org scoping
  if (tableName !== 'users') {
    query = query.eq('organization_id', organizationId);
  }

  // Apply filters — only allow whitelisted fields
  for (const filter of config.filters) {
    if (!allowedFields.has(filter.field)) continue;
    if (!filter.value) continue;

    switch (filter.operator) {
      case 'eq':
        query = query.eq(filter.field, filter.value);
        break;
      case 'neq':
        query = query.neq(filter.field, filter.value);
        break;
      case 'gt':
        query = query.gt(filter.field, filter.value);
        break;
      case 'lt':
        query = query.lt(filter.field, filter.value);
        break;
      case 'contains':
        query = query.ilike(filter.field, `%${filter.value}%`);
        break;
    }
  }

  query = query.order('created_at', { ascending: false }).limit(1000);

  const { data, error } = await query;
  if (error) throw new Error(`Query failed: ${error.message}`);

  return (data ?? []) as ReportRow[];
}

/* ─────────────────────────────────────────────────────────
   CSV generation
   ───────────────────────────────────────────────────────── */

/** Escape a CSV cell value */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert report rows to CSV string.
 * Uses the report's column config for header labels, falling back to field names.
 */
export function rowsToCsv(
  rows: ReportRow[],
  columns: QueryConfig['columns'],
): string {
  if (rows.length === 0) return 'No data\n';

  // Determine headers and fields from column config or from first row
  let headers: string[];
  let fields: string[];

  if (columns.length > 0) {
    headers = columns.map((c) => c.label || c.field);
    fields = columns.map((c) => c.field);
  } else {
    fields = Object.keys(rows[0]);
    headers = fields;
  }

  const lines: string[] = [headers.map(escapeCsv).join(',')];

  for (const row of rows) {
    const values = fields.map((f) => escapeCsv(row[f]));
    lines.push(values.join(','));
  }

  return lines.join('\n') + '\n';
}
