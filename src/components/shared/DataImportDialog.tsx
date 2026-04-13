'use client';

import { useState, useRef, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';
import { Check, AlertTriangle, Upload, Download, ArrowRight } from 'lucide-react';
import { getImportFields } from '@/lib/entity-fields';
import {
  parseCSV,
  parseTSV,
  parseXLSX,
  detectFileType,
  autoMatchColumns,
  validateRows,
  generateTemplate,
  requiredFieldCoverage,
} from '@/lib/import-parsers';
import type { ColumnMatch, RowValidation, ParsedFile } from '@/lib/import-parsers';
import { downloadBlob } from '@/lib/export-formats';
import FormLabel from '@/components/ui/FormLabel';
import { IconX } from '@/components/ui/Icons';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  errorRows: { row: number; reason: string }[];
}

interface DataImportDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityKey: string;
  apiEndpoint: string;
  onComplete?: (result: ImportResult) => void;
}

type Step = 'upload' | 'map' | 'validate' | 'preview' | 'done';

const BATCH_SIZE = 25;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataImportDialog({
  open,
  onClose,
  entityType,
  entityKey,
  apiEndpoint,
  onComplete,
}: DataImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMatch[]>([]);
  const [validations, setValidations] = useState<RowValidation[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fields = useMemo(() => getImportFields(entityKey), [entityKey]);

  const coverage = useMemo(() =>
    requiredFieldCoverage(mapping, entityKey),
    [mapping, entityKey],
  );

  const duplicateTargets = useMemo(() => {
    const seen = new Map<string, number>();
    const dupes = new Set<string>();
    for (const m of mapping) {
      if (!m.targetField) continue;
      const count = (seen.get(m.targetField.key) ?? 0) + 1;
      seen.set(m.targetField.key, count);
      if (count > 1) dupes.add(m.targetField.key);
    }
    return dupes;
  }, [mapping]);

  const validationSummary = useMemo(() => {
    let errors = 0, warnings = 0;
    for (const v of validations) {
      if (v.hasErrors) errors++;
      if (v.hasWarnings) warnings++;
    }
    const importable = validations.filter((v) => !v.skip && !v.hasErrors).length;
    return { errors, warnings, importable, total: validations.length };
  }, [validations]);

  const activeMappings = useMemo(() => mapping.filter((m) => m.targetField), [mapping]);
  const previewRows = useMemo(() => {
    if (!parsed) return [];
    const eligible = validations.filter((v) => !v.skip && !v.hasErrors);
    return eligible.slice(0, 10);
  }, [parsed, validations]);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // --- Early return AFTER all hooks ---
  if (!open || !mounted) return null;

  // ---- File handling ----

  async function handleFile(f: File) {
    setFile(f);
    const fileType = detectFileType(f);

    let data: ParsedFile;
    try {
      if (fileType === 'xlsx') {
        data = await parseXLSX(f);
      } else if (fileType === 'tsv') {
        const text = await f.text();
        data = parseTSV(text);
      } else {
        const text = await f.text();
        data = parseCSV(text);
      }
    } catch {
      return;
    }

    if (data.rowCount === 0) return;
    setParsed(data);

    const matches = autoMatchColumns(data.headers, fields);
    setMapping(matches);
    setStep('map');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) void handleFile(f);
  }

  function handleDownloadTemplate() {
    const csv = generateTemplate(entityKey);
    downloadBlob(csv, `${entityKey}-import-template.csv`, 'text/csv');
  }

  // ---- Column matching ----

  function updateMapping(sourceIndex: number, targetKey: string | null) {
    setMapping((prev) =>
      prev.map((m) =>
        m.sourceIndex === sourceIndex
          ? { ...m, targetField: targetKey ? fields.find((f) => f.key === targetKey) ?? null : null, confidence: targetKey ? 1 : 0 }
          : m,
      ),
    );
  }

  // ---- Validation ----

  function runValidation() {
    if (!parsed) return;
    const results = validateRows(parsed.rows, mapping);
    setValidations(results);
    setStep('validate');
  }

  function toggleRowSkip(rowIndex: number) {
    setValidations((prev) =>
      prev.map((v) => (v.rowIndex === rowIndex ? { ...v, skip: !v.skip } : v)),
    );
  }

  // ---- Import ----

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);
    setStep('done');

    const activeMapping = mapping.filter((m) => m.targetField);
    const rowsToImport = validations.filter((v) => !v.skip && !v.hasErrors);
    const total = rowsToImport.length;
    let created = 0, skipped = 0, errors = 0;
    const errorRows: { row: number; reason: string }[] = [];

    for (let batch = 0; batch < total; batch += BATCH_SIZE) {
      const chunk = rowsToImport.slice(batch, batch + BATCH_SIZE);
      const promises = chunk.map(async (v) => {
        const row = parsed.rows[v.rowIndex];
        const record: Record<string, string> = {};
        for (const m of activeMapping) {
          if (m.targetField && row[m.sourceIndex]) {
            record[m.targetField.key] = row[m.sourceIndex];
          }
        }

        try {
          const res = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
          });
          if (res.ok) {
            created++;
          } else {
            const body = await res.json().catch(() => ({}));
            errors++;
            errorRows.push({ row: v.rowIndex + 2, reason: body.error ?? `HTTP ${res.status}` });
          }
        } catch (err) {
          errors++;
          errorRows.push({ row: v.rowIndex + 2, reason: err instanceof Error ? err.message : 'Network error' });
        }
      });

      await Promise.all(promises);
      setProgress(Math.min(batch + BATCH_SIZE, total));
    }

    skipped = validations.filter((v) => v.skip || v.hasErrors).length;
    const finalResult = { created, skipped, errors, errorRows };
    setResult(finalResult);
    setImporting(false);
    onComplete?.(finalResult);
  }

  function handleDownloadErrorReport() {
    if (!result || result.errorRows.length === 0) return;
    const csv = ['Row,Error', ...result.errorRows.map((e) => `${e.row},"${e.reason.replace(/"/g, '""')}"`)].join('\n');
    downloadBlob(csv, `${entityKey}-import-errors.csv`, 'text/csv');
  }

  function handleReset() {
    setFile(null);
    setParsed(null);
    setMapping([]);
    setValidations([]);
    setResult(null);
    setProgress(0);
    setStep('upload');
  }

  // ---- Confidence badge ----

  function ConfidenceBadge({ confidence }: { confidence: number }) {
    if (confidence >= 0.8) return <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-green-700"><Check size={10} /></span>;
    if (confidence >= 0.5) return <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">~</span>;
    return null;
  }

  // ---- Step indicator ----

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'map', label: 'Map' },
    { key: 'validate', label: 'Validate' },
    { key: 'preview', label: 'Preview' },
    { key: 'done', label: 'Import' },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  // ======================================================================
  // RENDER
  // ======================================================================

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl border border-border bg-background shadow-xl animate-modal-content my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Import {entityType}</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {step === 'upload' && 'Upload a CSV, Excel, or TSV file to import records'}
              {step === 'map' && `Map columns from your file to ${entityType} fields`}
              {step === 'validate' && 'Review validation results before importing'}
              {step === 'preview' && 'Final preview of data to be imported'}
              {step === 'done' && (importing ? 'Importing records...' : 'Import complete')}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <IconX />
          </button>
        </div>

        {/* Step progress bar */}
        <div className="px-6 py-3 border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  i < stepIndex ? 'bg-green-500 text-background' : i === stepIndex ? 'bg-foreground text-background' : 'bg-bg-tertiary text-text-muted'
                }`}>
                  {i < stepIndex ? <Check size={11} /> : i + 1}
                </div>
                <span className={`ml-1.5 text-xs font-medium hidden sm:inline ${i === stepIndex ? 'text-foreground' : 'text-text-muted'}`}>{s.label}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i < stepIndex ? 'bg-green-500' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto">

          {/* ======== STEP 1: UPLOAD ======== */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl px-8 py-14 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-border hover:border-text-muted'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
                  <Upload size={24} className="text-text-muted" />
                </div>
                <p className="text-sm font-medium text-foreground">Drop your file here</p>
                <p className="mt-1 text-xs text-text-muted">Supports CSV, Excel (.xlsx), and TSV files</p>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.tsv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
                <Button onClick={() => inputRef.current?.click()} className="mt-4">
                  Select File
                </Button>
              </div>

              {/* Template download */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Download Template</p>
                  <p className="text-xs text-text-muted mt-0.5">Pre-formatted CSV with correct column headers and example data</p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background/80 transition-colors"
                >
                  <Download size={12} />
                  Template
                </button>
              </div>
            </div>
          )}

          {/* ======== STEP 2: COLUMN MAPPING ======== */}
          {step === 'map' && parsed && (
            <div className="space-y-4">
              {/* File info */}
              <div className="rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-secondary flex items-center justify-between">
                <span><strong>{file?.name}</strong> — {parsed.rowCount} rows, {parsed.headers.length} columns</span>
                {coverage.total > 0 && (
                  <span className={`text-xs font-medium ${coverage.mapped === coverage.total ? 'text-green-700' : 'text-amber-700'}`}>
                    {coverage.mapped}/{coverage.total} required fields mapped
                  </span>
                )}
              </div>

              {/* Missing required fields warning */}
              {coverage.missing.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                  <strong>Missing required:</strong> {coverage.missing.join(', ')}
                </div>
              )}

              {/* Mapping rows */}
              <div className="space-y-1.5">
                {mapping.map((m) => (
                  <div key={m.sourceIndex} className="flex items-center gap-3 px-1">
                    <span className="w-36 text-sm text-foreground truncate font-medium flex items-center gap-1.5">
                      {m.sourceHeader}
                      {m.targetField && <ConfidenceBadge confidence={m.confidence} />}
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-text-muted" />
                    <select
                      value={m.targetField?.key ?? ''}
                      onChange={(e) => updateMapping(m.sourceIndex, e.target.value || null)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 ${
                        m.targetField && duplicateTargets.has(m.targetField.key)
                          ? 'border-red-300 bg-red-500/10'
                          : 'border-border bg-background'
                      }`}
                    >
                      <option value="">Skip column</option>
                      {fields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}{f.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {duplicateTargets.size > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-800">
                  <strong>Duplicate mapping detected:</strong> Multiple columns target the same field
                </div>
              )}

              <p className="text-xs text-text-muted">* Required fields must be mapped</p>
            </div>
          )}

          {/* ======== STEP 3: VALIDATION ======== */}
          {step === 'validate' && parsed && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-center">
                  <p className="text-lg font-bold text-green-700 tabular-nums">{validationSummary.importable}</p>
                  <p className="text-xs text-text-muted">Ready to import</p>
                </div>
                <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-center">
                  <p className="text-lg font-bold text-amber-700 tabular-nums">{validationSummary.warnings}</p>
                  <p className="text-xs text-text-muted">Warnings</p>
                </div>
                <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-center">
                  <p className="text-lg font-bold text-red-700 tabular-nums">{validationSummary.errors}</p>
                  <p className="text-xs text-text-muted">Errors</p>
                </div>
              </div>

              {/* Filter toggle */}
              <FormLabel className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={showErrorsOnly}
                  onChange={() => setShowErrorsOnly(!showErrorsOnly)}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                <span>Show only rows with issues</span>
              </FormLabel>

              {/* Validation table */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="bg-bg-secondary border-b border-border">
                      <TableHead className="px-3 py-2 text-left text-text-muted font-medium w-10">#</TableHead>
                      <TableHead className="px-3 py-2 text-left text-text-muted font-medium w-14">Skip</TableHead>
                      {activeMappings.map((m) => (
                        <TableHead key={m.targetField!.key} className="px-3 py-2 text-left text-text-muted font-medium">
                          {m.targetField!.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validations
                      .filter((v) => !showErrorsOnly || v.hasErrors || v.hasWarnings)
                      .slice(0, 50)
                      .map((v) => (
                        <TableRow key={v.rowIndex} className={`border-t border-border ${v.skip ? 'opacity-40' : ''} ${v.hasErrors ? 'bg-red-500/5' : ''}`}>
                          <TableCell className="px-3 py-1.5 text-text-muted tabular-nums">{v.rowIndex + 1}</TableCell>
                          <TableCell className="px-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={v.skip}
                              onChange={() => toggleRowSkip(v.rowIndex)}
                              className="h-3 w-3 rounded border-border"
                            />
                          </TableCell>
                          {activeMappings.map((m) => {
                            const cell = v.cells[m.targetField!.key];
                            const value = parsed.rows[v.rowIndex]?.[m.sourceIndex] ?? '';
                            return (
                              <TableCell
                                key={m.targetField!.key}
                                className={`px-3 py-1.5 ${
                                  cell?.severity === 'error' ? 'text-red-700 bg-red-500/10' :
                                  cell?.severity === 'warning' ? 'text-amber-700 bg-amber-50/50' :
                                  'text-foreground'
                                }`}
                                title={cell?.message}
                              >
                                <span className="truncate max-w-[120px] inline-block">{value || '—'}</span>
                                {cell?.message && (
                                  <span className={`ml-1 inline-flex ${cell.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} title={cell.message}>
                                    <AlertTriangle size={10} />
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {validations.length > 50 && (
                  <div className="px-3 py-2 text-xs text-text-muted bg-bg-secondary border-t border-border">
                    Showing first 50 of {validations.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======== STEP 4: PREVIEW ======== */}
          {step === 'preview' && parsed && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-secondary">
                <strong>{validationSummary.importable}</strong> rows will be imported, <strong>{validationSummary.total - validationSummary.importable}</strong> will be skipped
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table className="w-full text-xs">
                  <TableHeader>
                    <TableRow className="bg-bg-secondary border-b border-border">
                      {activeMappings.map((m) => (
                        <TableHead key={m.targetField!.key} className="px-3 py-2 text-left font-medium text-text-muted">
                          {m.targetField!.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((v) => (
                      <TableRow key={v.rowIndex} className="border-t border-border hover:bg-bg-secondary/50">
                        {activeMappings.map((m) => {
                          const value = parsed.rows[v.rowIndex]?.[m.sourceIndex] ?? '';
                          const cell = v.cells[m.targetField!.key];
                          return (
                            <TableCell
                              key={m.targetField!.key}
                              className={`px-3 py-1.5 ${
                                cell?.severity === 'ok' ? 'text-foreground' :
                                cell?.severity === 'warning' ? 'text-amber-700' : 'text-foreground'
                              }`}
                            >
                              {value || '—'}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewRows.length < validationSummary.importable && (
                  <div className="px-3 py-2 text-xs text-text-muted bg-bg-secondary border-t border-border">
                    Showing {previewRows.length} of {validationSummary.importable} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======== STEP 5: IMPORT / DONE ======== */}
          {step === 'done' && (
            <div className="py-4">
              {importing ? (
                <div className="text-center">
                  <div className="mx-auto mb-6 h-28 w-28 relative">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-bg-tertiary" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6"
                        className="text-foreground transition-all duration-300"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / (validationSummary.importable || 1))}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {Math.round((progress / (validationSummary.importable || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">Importing records...</p>
                  <p className="text-xs text-text-muted mt-1">{progress} of {validationSummary.importable} rows processed</p>
                </div>
              ) : result && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <Check size={28} className="text-green-600" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Import Complete</p>
                  <div className="mt-4 flex justify-center gap-8 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700 tabular-nums">{result.created}</p>
                      <p className="text-xs text-text-muted">Created</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-700 tabular-nums">{result.skipped}</p>
                      <p className="text-xs text-text-muted">Skipped</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-700 tabular-nums">{result.errors}</p>
                      <p className="text-xs text-text-muted">Errors</p>
                    </div>
                  </div>
                  {result.errorRows.length > 0 && (
                    <button
                      onClick={handleDownloadErrorReport}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
                    >
                      <Download size={12} />
                      Download Error Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={step === 'done' && !importing ? handleReset : onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
          >
            {step === 'done' && !importing ? 'Import More' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {/* Back button */}
            {step === 'map' && (
              <button onClick={() => { setStep('upload'); setParsed(null); setFile(null); }} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
                Back
              </button>
            )}
            {step === 'validate' && (
              <button onClick={() => setStep('map')} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
                Back
              </button>
            )}
            {step === 'preview' && (
              <button onClick={() => setStep('validate')} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
                Back
              </button>
            )}

            {/* Forward button */}
            {step === 'map' && (
              <Button
                onClick={runValidation}
                disabled={!mapping.some((m) => m.targetField) || coverage.missing.length > 0 || duplicateTargets.size > 0}
              >
                Validate
              </Button>
            )}
            {step === 'validate' && (
              <Button
                onClick={() => setStep('preview')}
                disabled={validationSummary.importable === 0}
              >
                Preview
              </Button>
            )}
            {step === 'preview' && (
              <Button onClick={handleImport}
                disabled={importing}>
                Import {validationSummary.importable} Records
              </Button>
            )}
            {step === 'done' && !importing && (
              <Button onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
