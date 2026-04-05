'use client';

import { useState, useCallback } from 'react';

interface Column<T> {
  key: keyof T;
  label: string;
}

interface ExportButtonProps<T extends object> {
  data: T[];
  columns: Column<T>[];
  filename: string;
  label?: string;
}

/**
 * Client-side CSV export button. Generates a downloadable CSV file from the
 * provided data array using the column definitions for headers and field selection.
 */
export default function ExportButton<T extends object>({
  data,
  columns,
  filename,
  label = 'Export CSV',
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(() => {
    setExporting(true);
    try {
      // Build CSV
      const header = columns.map((c) => `"${c.label}"`).join(',');
      const rows = data.map((row) =>
        columns
          .map((c) => {
            const val = (row as Record<string, unknown>)[c.key as string];
            if (val == null) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(','),
      );
      const csv = [header, ...rows].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [data, columns, filename]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting || data.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary disabled:opacity-50"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 2v8M4 7l3 3 3-3" />
        <path d="M2 11h10" />
      </svg>
      {exporting ? 'Exporting...' : label}
    </button>
  );
}
