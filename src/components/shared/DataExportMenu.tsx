'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, Download, FileSpreadsheet, Sheet, FileJson2, FileType2, Printer, ClipboardCopy, Columns3, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getExportFields } from '@/lib/entity-fields';
import type { EntityField as _EntityField } from '@/lib/entity-fields';
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
  // Refresh fieldConfig if entityKey changes — use initializer keyed on allFields identity
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>(() =>
    allFields.map((f) => ({ key: f.key, label: f.label, visible: f.defaultExportVisible !== false })),
  );

  // Sync field config when allFields changes (entityKey swap)
  const [prevFields, setPrevFields] = useState(allFields);
  if (prevFields !== allFields) {
    setPrevFields(allFields);
    setFieldConfig(allFields.map((f) => ({ key: f.key, label: f.label, visible: f.defaultExportVisible !== false })));
  }

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
      performExport(format, data, visibleFields, filename);
      setIsOpen(false);
    },
    [data, visibleFields, filename],
  );

  const handleCopy = useCallback(async () => {
    const columns = visibleFields.map((f) => ({ key: f.key, label: f.label }));
    await copyToClipboard(data, columns);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data, visibleFields]);

  const handlePrint = useCallback(() => {
    printTable({
      title: entityType ?? filename,
      data,
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
      <Button
        variant="secondary"
        size="sm"
        onClick={() => { setIsOpen(!isOpen); setShowFieldConfig(false); }}
        disabled={data.length === 0}
      >
        <Download size={14} />
        Export
        <ChevronDown size={12} />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-white shadow-xl animate-modal-content overflow-hidden">

          {!showFieldConfig ? (
            <>
              {/* File formats */}
              <div className="px-2 pt-2 pb-1">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">File Formats</p>
                <button onClick={() => handleExport('csv')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileSpreadsheet size={14} /><span>CSV</span><span className="ml-auto text-[10px] text-text-muted">.csv</span>
                </button>
                <button onClick={() => handleExport('xlsx')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <Sheet size={14} /><span>Excel</span><span className="ml-auto text-[10px] text-text-muted">.xlsx</span>
                </button>
                <button onClick={() => handleExport('json')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileJson2 size={14} /><span>JSON</span><span className="ml-auto text-[10px] text-text-muted">.json</span>
                </button>
                <button onClick={() => handleExport('tsv')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <FileType2 size={14} /><span>TSV</span><span className="ml-auto text-[10px] text-text-muted">.tsv</span>
                </button>
              </div>

              <div className="border-t border-border mx-2" />

              {/* Actions */}
              <div className="px-2 pt-1 pb-1">
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Actions</p>
                <button onClick={handlePrint} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <Printer size={14} /><span>Print</span>
                </button>
                <button onClick={handleCopy} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <ClipboardCopy size={14} /><span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>

              <div className="border-t border-border mx-2" />

              {/* Settings */}
              <div className="px-2 pt-1 pb-2">
                <button onClick={() => setShowFieldConfig(true)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-bg-secondary transition-colors">
                  <Columns3 size={14} /><span>Field Visibility</span>
                  <ChevronRight size={10} className="ml-auto text-text-muted" />
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
                    <ChevronLeft size={14} />
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
                      className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                    />
                    <span className="flex-1 text-sm text-foreground">{fc.label}</span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="text-text-muted hover:text-foreground disabled:opacity-20 text-[9px] leading-none"
                      ><ChevronUp size={10} /></button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === fieldConfig.length - 1}
                        className="text-text-muted hover:text-foreground disabled:opacity-20 text-[9px] leading-none"
                      ><ChevronDown size={10} /></button>
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
