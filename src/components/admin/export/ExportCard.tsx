'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface ExportCardProps {
  platformName: string;
  platformLetter: string;
  platformColor: string;
  description: string;
  status: 'connected' | 'not_configured';
  onExport: () => void;
  previewData?: Record<string, unknown>;
  actions?: { label: string; onClick: () => void }[];
}

export default function ExportCard({
  platformName,
  platformLetter,
  platformColor,
  description,
  status,
  onExport,
  previewData,
  actions,
}: ExportCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold"
              style={{ backgroundColor: platformColor }}
            >
              {platformLetter}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-foreground">
                  {platformName}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    status === 'connected'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-bg-secondary text-gray-500'
                  }`}
                >
                  {status === 'connected' ? 'Connected' : 'Not Configured'}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" onClick={onExport}>
            Export
          </Button>
          {actions?.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-bg-secondary"
            >
              {action.label}
            </button>
          ))}
          {previewData && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="ml-auto rounded-lg border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
            >
              {showPreview ? 'Hide Preview' : 'Preview Data'}
            </button>
          )}
        </div>
      </div>

      {showPreview && previewData && (
        <div className="border-t border-border bg-[#f8f9fb] px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-2">
            Sample Output
          </p>
          <pre className="rounded-lg bg-[#1e293b] p-4 text-xs text-green-300 overflow-x-auto leading-relaxed font-mono">
            {JSON.stringify(previewData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
