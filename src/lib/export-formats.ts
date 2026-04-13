/**
 * Export format generation utilities — CSV, TSV, XLSX, JSON, and clipboard.
 * All functions are pure; they accept data arrays + field definitions.
 */

import type { EntityField } from './entity-fields';
import type { SheetData } from 'write-excel-file/browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = 'csv' | 'tsv' | 'xlsx' | 'json';

interface ExportColumn {
  key: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Core field-value extraction
// ---------------------------------------------------------------------------

function extractValue<T extends object>(row: T, key: string): string {
  const val = (row as Record<string, unknown>)[key];
  if (val == null) return '';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

// ---------------------------------------------------------------------------
// CSV Generation (RFC 4180)
// ---------------------------------------------------------------------------

function generateCSV<T extends object>(data: T[], columns: ExportColumn[]): string {
  const header = columns.map((c) => escapeCSV(c.label)).join(',');
  const rows = data.map((row) =>
    columns.map((c) => escapeCSV(extractValue(row, c.key))).join(','),
  );
  return [header, ...rows].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

// ---------------------------------------------------------------------------
// TSV Generation
// ---------------------------------------------------------------------------

function generateTSV<T extends object>(data: T[], columns: ExportColumn[]): string {
  const header = columns.map((c) => c.label).join('\t');
  const rows = data.map((row) =>
    columns.map((c) => extractValue(row, c.key).replace(/\t/g, ' ')).join('\t'),
  );
  return [header, ...rows].join('\n');
}

// ---------------------------------------------------------------------------
// JSON Generation
// ---------------------------------------------------------------------------

function generateJSON<T extends object>(data: T[], columns: ExportColumn[]): string {
  const filtered = data.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const c of columns) {
      obj[c.key] = (row as Record<string, unknown>)[c.key] ?? null;
    }
    return obj;
  });
  return JSON.stringify(filtered, null, 2);
}

// ---------------------------------------------------------------------------
// XLSX Generation (via write-excel-file)
// ---------------------------------------------------------------------------

async function generateXLSX<T extends object>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
): Promise<void> {
  const writeXlsxFile = (await import('write-excel-file/browser')).default;

  // Header row — each cell is { value, fontWeight }
  const headerRow = columns.map((c) => ({
    value: c.label,
    fontWeight: 'bold' as const,
  }));

  // Data rows
  const dataRows = data.map((row) =>
    columns.map((c) => {
      const raw = (row as Record<string, unknown>)[c.key];
      if (raw == null) return { value: null };
      if (typeof raw === 'number') return { value: raw };
      if (Array.isArray(raw)) return { value: raw.join(', ') };
      return { value: String(raw) };
    }),
  );

  await writeXlsxFile([headerRow, ...dataRows] as SheetData, {
    fileName: `${filename}.xlsx`,
  });
}

// ---------------------------------------------------------------------------
// Clipboard (tab-separated for paste into spreadsheets)
// ---------------------------------------------------------------------------

export async function copyToClipboard<T extends object>(
  data: T[],
  columns: ExportColumn[],
): Promise<void> {
  const tsv = generateTSV(data, columns);
  await navigator.clipboard.writeText(tsv);
}

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Perform an export in the given format */
export function performExport<T extends object>(
  format: ExportFormat,
  data: T[],
  fields: EntityField[],
  filename: string,
): void {
  const columns: ExportColumn[] = fields.map((f) => ({ key: f.key, label: f.label }));

  switch (format) {
    case 'csv': {
      const csv = generateCSV(data, columns);
      downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      break;
    }
    case 'tsv': {
      const tsv = generateTSV(data, columns);
      downloadBlob(tsv, `${filename}.tsv`, 'text/tab-separated-values;charset=utf-8;');
      break;
    }
    case 'json': {
      const json = generateJSON(data, columns);
      downloadBlob(json, `${filename}.json`, 'application/json;charset=utf-8;');
      break;
    }
    case 'xlsx': {
      void generateXLSX(data, columns, filename);
      break;
    }
  }
}
