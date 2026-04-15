import { TierGate } from '@/components/shared/TierGate';
import { IconNavPipeline, IconBarChart, IconNavProfitability, IconForm, IconNavCrew, IconSettings } from '@/components/ui/Icons';

interface PortalReportsPageProps {
  params: Promise<{ orgSlug: string }>;
}

const reportTypes = [
  {
    title: 'Pipeline Analysis',
    description: 'Analyze deal flow, conversion rates, and pipeline health across stages.',
    icon: <IconNavPipeline strokeWidth={1.5} size={24} />,
  },
  {
    title: 'Win Rate',
    description: 'Track win/loss ratios over time by client, source, and deal size.',
    icon: <IconBarChart strokeWidth={1.5} size={24} />,
  },
  {
    title: 'Revenue Trends',
    description: 'Monthly and quarterly revenue tracking, forecasting, and growth analysis.',
    icon: <IconNavProfitability strokeWidth={1.5} size={24} />,
  },
  {
    title: 'WIP Report',
    description: 'Unbilled time and expenses by active project for revenue leakage tracking.',
    icon: <IconForm strokeWidth={1.5} size={24} />,
  },
  {
    title: 'Utilization',
    description: 'Billable vs non-billable hours per team member with capacity tracking.',
    icon: <IconNavCrew strokeWidth={1.5} size={24} />,
  },
  {
    title: 'Custom Report Builder',
    description: 'Build custom reports with drag-and-drop columns, filters, and visualizations.',
    icon: <IconSettings strokeWidth={1.5} size={24} />,
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
              className="group rounded-xl border border-border bg-background p-6 transition-colors hover:border-foreground/20"
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
