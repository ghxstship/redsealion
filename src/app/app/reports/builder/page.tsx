'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { ReportBuilder } from '@/components/admin/reports/ReportBuilder';

export default function ReportBuilderPage() {
  const [saved, setSaved] = useState(false);

  return (
    <TierGate feature="custom_reports">
      <div className="mb-6">
        <Link
          href="/app/reports"
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          &larr; Back to Reports
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Report Builder
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Create custom reports with your chosen data sources, columns, and filters.
        </p>
      </div>

      {saved && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <p className="text-sm text-green-800">Report saved successfully.</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white px-5 py-5">
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Report Name</label>
            <input
              type="text"
              placeholder="e.g., Monthly revenue by client"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <input
              type="text"
              placeholder="Brief description of this report"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <ReportBuilder
          onSave={(config) => {
            console.log('Report config:', config);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
        />
      </div>
    </TierGate>
  );
}
