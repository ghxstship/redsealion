'use client';

import { useState, useRef, useCallback } from 'react';

interface ImportColumn {
  sourceHeader: string;
  targetField: string | null;
}

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  targetFields: { key: string; label: string; required?: boolean }[];
  apiEndpoint: string;
}

export default function ImportDialog({ open, onClose, entityType, targetFields, apiEndpoint }: ImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ImportColumn[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function parseCSV(text: string): string[][] {
    return text.trim().split('\n').map((line) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
        current += char;
      }
      result.push(current.trim());
      return result;
    });
  }

  async function handleFile(f: File) {
    setFile(f);
    const text = await f.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) return;
    const hdrs = parsed[0];
    setHeaders(hdrs);
    setRows(parsed.slice(1));
    setMapping(hdrs.map((h) => ({
      sourceHeader: h,
      targetField: targetFields.find((tf) => tf.key.toLowerCase() === h.toLowerCase() || tf.label.toLowerCase() === h.toLowerCase())?.key ?? null,
    })));
    setStep('map');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) void handleFile(f);
  }

  function updateMapping(index: number, targetField: string | null) {
    setMapping((prev) => prev.map((m, i) => (i === index ? { ...m, targetField } : m)));
  }

  async function handleImport() {
    setImporting(true);
    let created = 0, skipped = 0, errors = 0;
    for (const row of rows) {
      const record: Record<string, string> = {};
      mapping.forEach((m, i) => { if (m.targetField && row[i]) record[m.targetField] = row[i]; });
      const requiredMissing = targetFields.filter((f) => f.required).some((f) => !record[f.key]);
      if (requiredMissing) { skipped++; continue; }
      try {
        const res = await fetch(apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) });
        if (res.ok) created++; else errors++;
      } catch { errors++; }
    }
    setResult({ created, skipped, errors });
    setImporting(false);
    setStep('done');
  }

  function handleReset() {
    setFile(null); setRows([]); setHeaders([]); setMapping([]); setResult(null); setStep('upload');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Import {entityType}</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {step === 'upload' && 'Upload a CSV file to import records'}
              {step === 'map' && `Map columns from your file to ${entityType} fields`}
              {step === 'preview' && 'Review mapped data before importing'}
              {step === 'done' && 'Import complete'}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-xl px-8 py-16 text-center transition-colors ${dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-border'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-muted"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              </div>
              <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
              <p className="mt-1 text-xs text-text-muted">or click to browse</p>
              <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
              <button onClick={() => inputRef.current?.click()} className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 transition-colors">
                Select File
              </button>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'map' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-secondary">
                <strong>{file?.name}</strong> — {rows.length} rows, {headers.length} columns
              </div>
              <div className="space-y-2">
                {mapping.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-40 text-sm text-foreground truncate font-medium">{m.sourceHeader}</span>
                    <span className="text-text-muted">→</span>
                    <select
                      value={m.targetField ?? ''}
                      onChange={(e) => updateMapping(i, e.target.value || null)}
                      className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                    >
                      <option value="">Skip column</option>
                      {targetFields.map((tf) => <option key={tf.key} value={tf.key}>{tf.label}{tf.required ? ' *' : ''}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="text-xs text-text-muted">* Required fields must be mapped</div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead><tr className="bg-bg-secondary">
                  {mapping.filter((m) => m.targetField).map((m) => (
                    <th key={m.targetField} className="px-3 py-2 text-left font-medium text-text-muted">
                      {targetFields.find((f) => f.key === m.targetField)?.label}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.slice(0, 5).map((row, ri) => (
                    <tr key={ri} className="border-t border-border">
                      {mapping.filter((m) => m.targetField).map((m, mi) => {
                        const colIdx = mapping.indexOf(m);
                        return <td key={mi} className="px-3 py-1.5 text-foreground">{row[colIdx] ?? ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && <div className="px-3 py-2 text-xs text-text-muted bg-bg-secondary">+ {rows.length - 5} more rows</div>}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && result && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-green-600"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <p className="text-sm font-medium text-foreground">Import Complete</p>
              <div className="mt-3 flex justify-center gap-6 text-sm">
                <span className="text-green-700">{result.created} created</span>
                <span className="text-amber-700">{result.skipped} skipped</span>
                <span className="text-red-700">{result.errors} errors</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button onClick={step === 'done' ? handleReset : onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            {step === 'done' ? 'Import More' : 'Cancel'}
          </button>
          <div className="flex gap-2">
            {step === 'map' && <button onClick={() => setStep('preview')} disabled={!mapping.some((m) => m.targetField)} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 disabled:opacity-50 transition-colors">Preview</button>}
            {step === 'preview' && <button onClick={handleImport} disabled={importing} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 disabled:opacity-50 transition-colors">{importing ? 'Importing...' : `Import ${rows.length} Records`}</button>}
            {step === 'done' && <button onClick={onClose} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 transition-colors">Done</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
