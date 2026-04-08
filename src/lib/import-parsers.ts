/**
 * Import parsing utilities — CSV/TSV/XLSX parsing, fuzzy column matching,
 * per-cell validation, and template generation.
 */

import type { EntityField } from './entity-fields';
import { getImportFields, getRequiredFields } from './entity-fields';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedFile {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export interface ColumnMatch {
  sourceIndex: number;
  sourceHeader: string;
  targetField: EntityField | null;
  confidence: number; // 0–1
}

export interface CellValidation {
  valid: boolean;
  severity: 'error' | 'warning' | 'ok';
  message?: string;
}

export interface RowValidation {
  rowIndex: number;
  cells: Record<string, CellValidation>;
  hasErrors: boolean;
  hasWarnings: boolean;
  skip: boolean;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/** Parse CSV text (RFC 4180 compliant, handles quoted fields, BOM) */
export function parseCSV(text: string): ParsedFile {
  // Strip BOM
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = parseDelimited(clean, ',');
  if (rows.length < 2) return { headers: rows[0] ?? [], rows: [], rowCount: 0 };
  return { headers: rows[0], rows: rows.slice(1), rowCount: rows.length - 1 };
}

/** Parse TSV text */
export function parseTSV(text: string): ParsedFile {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = parseDelimited(clean, '\t');
  if (rows.length < 2) return { headers: rows[0] ?? [], rows: [], rowCount: 0 };
  return { headers: rows[0], rows: rows.slice(1), rowCount: rows.length - 1 };
}

/** Parse XLSX file using read-excel-file */
export async function parseXLSX(file: File): Promise<ParsedFile> {
  const readXlsxFile = (await import('read-excel-file/browser')).default;
  const result = await readXlsxFile(file);
  // result may be Row[][] or ReadFileResult depending on version — normalise via unknown
  const raw = result as unknown;
  const data = Array.isArray(raw) && (raw as unknown[]).length > 0 && typeof (raw as Record<string, unknown>[])[0] === 'object' && 'data' in (raw as Record<string, unknown>[])[0]
    ? (raw as { sheet: string; data: (string | number | boolean | null)[][] }[])[0].data
    : (raw as (string | number | boolean | null)[][]);
  if (data.length < 2) return { headers: (data[0] ?? []).map(String), rows: [], rowCount: 0 };
  return {
    headers: data[0].map(String),
    rows: data.slice(1).map((row) => row.map((cell: unknown) => (cell == null ? '' : String(cell)))),
    rowCount: data.length - 1,
  };
}

/** Core delimited text parser — handles quoted fields with embedded delimiters and newlines */
function parseDelimited(text: string, delimiter: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === delimiter) {
      row.push(current.trim());
      current = '';
      i++;
      continue;
    }

    if (char === '\n' || (char === '\r' && text[i + 1] === '\n')) {
      row.push(current.trim());
      if (row.some((c) => c !== '')) result.push(row);
      row = [];
      current = '';
      i += char === '\r' ? 2 : 1;
      continue;
    }

    if (char === '\r') {
      row.push(current.trim());
      if (row.some((c) => c !== '')) result.push(row);
      row = [];
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Flush last row
  row.push(current.trim());
  if (row.some((c) => c !== '')) result.push(row);

  return result;
}

// ---------------------------------------------------------------------------
// Auto-detect file type
// ---------------------------------------------------------------------------

export function detectFileType(file: File): 'csv' | 'tsv' | 'xlsx' | 'unknown' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || file.type === 'text/csv') return 'csv';
  if (name.endsWith('.tsv') || file.type === 'text/tab-separated-values') return 'tsv';
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')) return 'xlsx';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Fuzzy Column Matching
// ---------------------------------------------------------------------------

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

/** Compute similarity 0–1 between two strings (case-insensitive, normalized) */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

/** Normalize a header string for matching */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Auto-match source headers to target fields using fuzzy matching + alias lookup */
export function autoMatchColumns(headers: string[], fields: EntityField[]): ColumnMatch[] {
  const usedFieldKeys = new Set<string>();

  return headers.map((header, sourceIndex) => {
    let bestMatch: EntityField | null = null;
    let bestConfidence = 0;

    for (const field of fields) {
      if (usedFieldKeys.has(field.key)) continue;

      // Direct key/label match → confidence 1.0
      const directSim = Math.max(
        similarity(header, field.key),
        similarity(header, field.label),
      );

      // Alias match → confidence 0.95
      let aliasSim = 0;
      if (field.aliases) {
        for (const alias of field.aliases) {
          aliasSim = Math.max(aliasSim, similarity(header, alias));
        }
        aliasSim = Math.min(aliasSim * 0.95, 0.95);
      }

      const confidence = Math.max(directSim, aliasSim);

      if (confidence > bestConfidence && confidence >= 0.45) {
        bestConfidence = confidence;
        bestMatch = field;
      }
    }

    if (bestMatch) usedFieldKeys.add(bestMatch.key);

    return {
      sourceIndex,
      sourceHeader: header,
      targetField: bestMatch,
      confidence: bestConfidence,
    };
  });
}

// ---------------------------------------------------------------------------
// Cell Validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s().+\-x#]+$/;
const URL_RE = /^https?:\/\/.+/i;

/** Validate a single cell value against a field definition */
export function validateCell(value: string, field: EntityField): CellValidation {
  const trimmed = value.trim();

  // Required check
  if (field.required && !trimmed) {
    return { valid: false, severity: 'error', message: `${field.label} is required` };
  }

  // Empty optional field is always ok
  if (!trimmed) return { valid: true, severity: 'ok' };

  switch (field.type) {
    case 'email':
      if (!EMAIL_RE.test(trimmed)) {
        return { valid: false, severity: 'error', message: 'Invalid email format' };
      }
      break;

    case 'phone':
      if (!PHONE_RE.test(trimmed)) {
        return { valid: false, severity: 'warning', message: 'Unusual phone format' };
      }
      break;

    case 'url':
      if (!URL_RE.test(trimmed)) {
        return { valid: false, severity: 'warning', message: 'URL should start with http:// or https://' };
      }
      break;

    case 'number':
    case 'currency': {
      const num = Number(trimmed.replace(/[$,]/g, ''));
      if (isNaN(num)) {
        return { valid: false, severity: 'error', message: 'Not a valid number' };
      }
      if (num < 0) {
        return { valid: true, severity: 'warning', message: 'Negative value' };
      }
      break;
    }

    case 'date': {
      const parsed = parseFlexDate(trimmed);
      if (!parsed) {
        return { valid: false, severity: 'error', message: 'Unrecognized date format' };
      }
      break;
    }

    case 'enum':
      if (field.enumValues && !field.enumValues.includes(trimmed.toLowerCase().replace(/\s+/g, '_'))) {
        const closest = findClosestEnum(trimmed, field.enumValues);
        return {
          valid: false,
          severity: 'warning',
          message: closest ? `Did you mean "${closest}"?` : `Valid values: ${field.enumValues.join(', ')}`,
        };
      }
      break;

    case 'text':
      if (field.pattern && !field.pattern.test(trimmed)) {
        return { valid: false, severity: 'warning', message: 'Does not match expected format' };
      }
      break;
  }

  return { valid: true, severity: 'ok' };
}

/** Parse a date string in multiple formats */
function parseFlexDate(s: string): Date | null {
  // ISO: YYYY-MM-DD or full ISO
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // MM/DD/YYYY or M/D/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const year = slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3]);
    d = new Date(year, Number(slash[1]) - 1, Number(slash[2]));
    if (!isNaN(d.getTime())) return d;
  }

  // DD-MM-YYYY
  const dash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) {
    d = new Date(Number(dash[3]), Number(dash[2]) - 1, Number(dash[1]));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/** Find the closest enum value by similarity */
function findClosestEnum(value: string, options: string[]): string | null {
  let best = '';
  let bestSim = 0;
  const norm = normalize(value);
  for (const opt of options) {
    const sim = similarity(norm, normalize(opt));
    if (sim > bestSim) {
      bestSim = sim;
      best = opt;
    }
  }
  return bestSim > 0.5 ? best : null;
}

// ---------------------------------------------------------------------------
// Bulk Row Validation
// ---------------------------------------------------------------------------

/** Validate all rows against mapped columns */
export function validateRows(
  rows: string[][],
  mapping: ColumnMatch[],
): RowValidation[] {
  const activeMappings = mapping.filter((m) => m.targetField);

  return rows.map((row, rowIndex) => {
    const cells: Record<string, CellValidation> = {};
    let hasErrors = false;
    let hasWarnings = false;

    for (const m of activeMappings) {
      const value = row[m.sourceIndex] ?? '';
      const validation = validateCell(value, m.targetField!);
      cells[m.targetField!.key] = validation;
      if (validation.severity === 'error') hasErrors = true;
      if (validation.severity === 'warning') hasWarnings = true;
    }

    return { rowIndex, cells, hasErrors, hasWarnings, skip: false };
  });
}

// ---------------------------------------------------------------------------
// Template Generation
// ---------------------------------------------------------------------------

/** Generate a downloadable CSV template for an entity */
export function generateTemplate(entityKey: string): string {
  const fields = getImportFields(entityKey);
  const headers = fields.map((f) => f.label + (f.required ? ' *' : ''));
  const examples = fields.map((f) => f.example ?? '');
  return [headers.join(','), examples.join(',')].join('\n');
}

/** Required field coverage: how many required fields are currently mapped */
export function requiredFieldCoverage(
  mapping: ColumnMatch[],
  entityKey: string,
): { mapped: number; total: number; missing: string[] } {
  const required = getRequiredFields(entityKey);
  const mappedKeys = new Set(mapping.filter((m) => m.targetField).map((m) => m.targetField!.key));
  const missing = required.filter((f) => !mappedKeys.has(f.key)).map((f) => f.label);
  return { mapped: required.length - missing.length, total: required.length, missing };
}
