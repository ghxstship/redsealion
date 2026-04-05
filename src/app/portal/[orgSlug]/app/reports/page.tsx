import { TierGate } from '@/components/shared/TierGate';

interface PortalReportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

const reportTypes = [
  {
    title: 'Pipeline Analysis',
    description: 'Analyze deal flow, conversion rates, and pipeline health across stages.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4h22v4l-8 5.3v6.7l-6 3v-9.7L1 8V4Z" />
      </svg>
    ),
  },
  {
    title: 'Win Rate',
    description: 'Track win/loss ratios over time by client, source, and deal size.',
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18" />
        <path d="M3 20V4" />
        <path d="M7 16l4-6 4 4 5-8" />
      </svg>
    ),
  },
  {
    title: 'WIP Report',
    description: 'Unbilled time and expenses by active project for revenue leakage tracking.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    title: 'Utilization',
    description: 'Billable vs non-billable hours per team member with capacity tracking.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Custom Report Builder',
    description: 'Build custom reports with drag-and-drop columns, filters, and visualizations.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
      </svg>
    ),
  },
];

export default function PortalReportsPage() {

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
            <div
              key={report.title}
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
            </div>
          ))}
        </div>
      </TierGate>
    </>
  );
}
