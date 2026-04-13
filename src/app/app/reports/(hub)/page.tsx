import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { Filter, TrendingUp, Funnel, PieChart, BarChart3, LayoutDashboard, Users, Wrench, FileText } from 'lucide-react';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../ReportsHubTabs';

const reportTypes = [
  {
    title: 'Pipeline Analysis',
    description: 'Analyze deal flow, conversion rates, and pipeline health across stages.',
    href: '/app/reports/pipeline',
    icon: <Filter size={24} />,
  },
  {
    title: 'Sales Forecast',
    description: 'Revenue projections with best case, committed, and weighted pipeline views.',
    href: '/app/reports/forecast',
    icon: <TrendingUp size={24} />,
  },
  {
    title: 'Conversion Funnel',
    description: 'Stage-by-stage conversion rates, drop-off analysis, and pipeline velocity.',
    href: '/app/reports/funnel',
    icon: <Funnel size={24} />,
  },
  {
    title: 'Win Rate',
    description: 'Track win/loss ratios over time by client, source, and deal size.',
    href: '/app/reports/win-rate',
    icon: <PieChart size={24} />,
  },
  {
    title: 'Revenue Trends',
    description: 'Monthly and quarterly revenue tracking, forecasting, and growth analysis.',
    href: '/app/reports/revenue',
    icon: <BarChart3 size={24} />,
  },
  {
    title: 'Work in Progress (WIP)',
    description: 'Unbilled time and expenses by active project for revenue leakage tracking.',
    href: '/app/reports/wip',
    icon: <LayoutDashboard size={24} />,
  },
  {
    title: 'Utilization',
    description: 'Billable vs non-billable hours per team member with capacity tracking.',
    href: '/app/reports/utilization',
    icon: <Users size={24} />,
  },
  {
    title: 'Custom Report Builder',
    description: 'Build custom reports with drag-and-drop columns, filters, and visualizations.',
    href: '/app/reports/builder',
    icon: <Wrench size={24} />,
  },
];

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

async function getSavedReports(): Promise<SavedReport[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('custom_reports')
      .select('id, name, description, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(12);

    return (data ?? []) as SavedReport[];
  } catch {
    return [];
  }
}

export default async function ReportsPage() {
  const savedReports = await getSavedReports();

  return (
    <TierGate feature="reports">
      <PageHeader title="Reports" subtitle="Analytics and insights across your pipeline" />

      <ReportsHubTabs />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Link
              key={report.href}
              href={report.href}
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
            </Link>
          ))}
        </div>

        {/* Saved Custom Reports */}
        {savedReports.length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-semibold text-foreground mb-4">Saved Reports</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/app/reports/builder?id=${report.id}`}
                  className="rounded-xl border border-border bg-background p-5 hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-secondary text-text-muted flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{report.name}</h3>
                      {report.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{report.description}</p>
                      )}
                      <p className="text-[11px] text-text-muted mt-2">
                        Created {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
    </TierGate>
  );
}
