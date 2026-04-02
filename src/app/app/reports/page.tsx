import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';

const reportTypes = [
  {
    title: 'Pipeline Analysis',
    description: 'Analyze deal flow, conversion rates, and pipeline health across stages.',
    href: '/app/reports/pipeline',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4h22v4l-8 5.3v6.7l-6 3v-9.7L1 8V4Z" />
      </svg>
    ),
  },
  {
    title: 'Win Rate',
    description: 'Track win/loss ratios over time by client, source, and deal size.',
    href: '/app/reports/win-rate',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 0 20" />
        <path d="M12 2v20" />
      </svg>
    ),
  },
  {
    title: 'Revenue Trends',
    description: 'Monthly and quarterly revenue tracking, forecasting, and growth analysis.',
    href: '/app/reports/revenue',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18" />
        <path d="M3 20V4" />
        <path d="M7 16l4-6 4 4 5-8" />
      </svg>
    ),
  },
];

export default function ReportsPage() {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Reports
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Analytics and insights across your pipeline
          </p>
        </div>
      </div>

      <TierGate feature="reports">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="group rounded-xl border border-border bg-white p-6 transition-colors hover:border-foreground/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-secondary text-text-muted group-hover:text-foreground transition-colors">
                  {report.icon}
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  {report.title}
                </h2>
              </div>
              <p className="text-sm text-text-secondary">
                {report.description}
              </p>
            </Link>
          ))}
        </div>
      </TierGate>
    </>
  );
}
