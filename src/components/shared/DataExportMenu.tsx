'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getExportFields } from '@/lib/entity-fields';
import type { EntityField } from '@/lib/entity-fields';
import { performExport, copyToClipboard } from '@/lib/export-formats';
import type { ExportFormat } from '@/lib/export-formats';
import { printTable } from '@/lib/print-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DataExportMenuProps<T extends object> {
  data: T[];
  entityKey: string;
  filename: string;
  entityType?: string;
  entityId?: string;
}

interface FieldConfig {
  key: string;
  label: string;
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function FileCSVIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" /><path d="M5 5.5h4M5 8h2.5" />
    </svg>
  );
}

function FileExcelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" />
      <path d="M5 5l4 4M9 5l-4 4" stroke="#16a34a" strokeWidth="1.5" />
    </svg>
  );
}

function FileJsonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" /><path d="M5 5.5c0-1 .5-1.5 1.5-1.5M9 8.5c0 1-.5 1.5-1.5 1.5" />
    </svg>
  );
}

function FileTsvIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="2" y="1.5" width="10" height="11" rx="1.5" /><path d="M7 4v6M4.5 4h5" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M4 5V1.5h6V5" /><rect x="1.5" y="5" width="11" height="5" rx="1" /><path d="M4 8.5h6v4H4z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="3.5" y="2" width="7" height="10" rx="1.5" /><path d="M5.5 1h3a.5.5 0 0 1 .5.5V3H5V1.5a.5.5 0 0 1 .5-.5z" />
    </svg>
  );
}

function ColumnsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <rect x="1.5" y="2" width="11" height="10" rx="1.5" /><path d="M5.5 2v10M8.5 2v10" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DataExportMenu<T extends object>({
  data,
  entityKey,
  filename,
  entityType,
}: DataExportMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Build field config from registry
  const allFields = useMemo(() => getExportFields(entityKey), [entityKey]);
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>(() =>
    allFields.map((f) => ({ key: f.key, label: f.label, visible: f.defaultExportVisible !== false })),
  );

  // Refresh fieldConfig if entityKey changes
  useEffect(() => {
    setFieldConfig(allFields.map((f) => ({ key: f.key, label: f.label, visible: f.defaultExportVisible !== false })));
  }, [allFields]);

  const visibleFields = useMemo(() => {
    const visibleKeys = new Set(fieldConfig.filter((fc) => fc.visible).map((fc) => fc.key));
    return allFields.filter((f) => visibleKeys.has(f.key));
  }, [fieldConfig, allFields]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowFieldConfig(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      performExport(format, data as unknown as Record<string, unknown>[], visibleFields, filename);
      setIsOpen(false);
    },
    [data, visibleFields, filename],
  );

  const handleCopy = useCallback(async () => {
    const columns = visibleFields.map((f) => ({ key: f.key, label: f.label }));
    await copyToClipboard(data as unknown as Record<string, unknown>[], columns);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data, visibleFields]);

  const handlePrint = useCallback(() => {
    printTable({
      title: entityType ?? filename,
      data: data as unknown as Record<string, unknown>[],
      fields: visibleFields,
      subtitle: `${data.length} records`,
    });
    setIsOpen(false);
  }, [data, visibleFields, entityType, filename]);

  function toggleFieldVisibility(key: string) {
    setFieldConfig((prev) =>
      prev.map((fc) => (fc.key === key ? { ...fc, visible: !fc.visible } : fc)),
    );
  }

  function moveField(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fieldConfig.length) return;
    setFieldConfig((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }

  function resetFields() {
    setFieldConfig(allFields.map((f) => ({ key: f.key, label: f.label, visible: f.defaultExportVisible !== false })));
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowFieldConfig(false); }}
        disabled={data.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 2v8M4 7l3 3 3-3" /><path d="M2 11h10" />
        </svg>
        Export
        <ChevronDownIcon />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-white shadow-xl animate-modal-content overflow-hidden">

          {!showFieldConfig ? (
            <>
              {/* File formats */}
              <div className="px-2 pt-2 pb-1">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">File Formats</p>
                <button onClick={() => handleExport('csv')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileCSVIcon /><span>CSV</span><span className="ml-auto text-[10px] text-text-muted">.csv</span>
                </button>
                <button onClick={() => handleExport('xlsx')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileExcelIcon /><span>Excel</span><span className="ml-auto text-[10px] text-text-muted">.xlsx</span>
                </button>
                <button onClick={() => handleExport('json')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileJsonIcon /><span>JSON</span><span className="ml-auto text-[10px] text-text-muted">.json</span>
                </button>
                <button onClick={() => handleExport('tsv')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileTsvIcon /><span>TSV</span><span className="ml-auto text-[10px] text-text-muted">.tsv</span>
                </button>
              </div>

              <div className="border-t border-border mx-2" />

              {/* Actions */}
              <div className="px-2 pt-1 pb-1">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Actions</p>
                <button onClick={handlePrint} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <PrintIcon /><span>Print</span>
                </button>
                <button onClick={handleCopy} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <ClipboardIcon /><span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <div className="border-t border-border mx-2" />

              {/* Settings */}
              <div className="px-2 pt-1 pb-2">
                <button onClick={() => setShowFieldConfig(true)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <ColumnsIcon /><span>Field Visibility</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="ml-auto text-text-muted"><path d="M3.5 2l3 3-3 3" /></svg>
                </button>
              </div>

              {/* Record count footer */}
              <div className="border-t border-border bg-bg-secondary px-4 py-2 text-[10px] text-text-muted">
                {data.length} records · {visibleFields.length} fields
              </div>
            </>
          ) : (
            /* Field configuration sub-panel */
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowFieldConfig(false)} className="text-text-muted hover:text-foreground transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8.5 3L5 7l3.5 4" /></svg>
                  </button>
                  <span className="text-sm font-semibold text-foreground">Field Visibility</span>
                </div>
                <button onClick={resetFields} className="text-[10px] font-medium text-text-muted hover:text-foreground transition-colors">
                  Reset
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto px-2 py-2">
                {fieldConfig.map((fc, index) => (
                  <div key={fc.key} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-bg-secondary transition-colors">
                    <input
                      type="checkbox"
                      checked={fc.visible}
                      onChange={() => toggleFieldVisibility(fc.key)}
                      className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20"
                    />
                    <span className="flex-1 text-sm text-foreground">{fc.label}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="text-text-muted hover:text-foreground disabled:opacity-20 text-[9px] leading-none"
                      >▲</button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === fieldConfig.length - 1}
                        className="text-text-muted hover:text-foreground disabled:opacity-20 text-[9px] leading-none"
                      >▼</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
