import { formatCurrency } from '@/lib/utils';

interface MaintenanceRecord {
  id: string;
  type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  cost: number | null;
}

interface MaintenanceKPIsProps {
  records: MaintenanceRecord[];
}

/**
 * Maintenance KPI cards — computed from maintenance records.
 * Displays MTBF, MTTR, total cost YTD, and failure count.
 */
export default function MaintenanceKPIs({ records }: MaintenanceKPIsProps) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Only repair-type records for MTBF/MTTR
  const repairs = records.filter((r) => r.type.toLowerCase() === 'repair');
  const completedRepairs = repairs.filter((r) => r.completed_date);

  // MTTR: average days from scheduled to completed for repairs
  let mttr = 0;
  if (completedRepairs.length > 0) {
    const totalDays = completedRepairs.reduce((sum, r) => {
      const scheduled = new Date(r.scheduled_date);
      const completed = new Date(r.completed_date!);
      return sum + Math.max(0, (completed.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    mttr = totalDays / completedRepairs.length;
  }

  // MTBF: average days between consecutive repair events
  let mtbf = 0;
  if (completedRepairs.length >= 2) {
    const sorted = [...completedRepairs].sort(
      (a, b) => new Date(a.completed_date!).getTime() - new Date(b.completed_date!).getTime(),
    );
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (new Date(sorted[i].completed_date!).getTime() - new Date(sorted[i - 1].completed_date!).getTime()) / (1000 * 60 * 60 * 24);
    }
    mtbf = totalGap / (sorted.length - 1);
  }

  // YTD cost
  const ytdRecords = records.filter((r) => new Date(r.scheduled_date) >= yearStart);
  const totalCostYtd = ytdRecords.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  const cards = [
    { label: 'MTBF', value: mtbf > 0 ? `${Math.round(mtbf)}d` : '—', sublabel: 'Mean Time Between Failures' },
    { label: 'MTTR', value: mttr > 0 ? `${mttr.toFixed(1)}d` : '—', sublabel: 'Mean Time To Repair' },
    { label: 'Cost YTD', value: formatCurrency(totalCostYtd), sublabel: `${ytdRecords.length} records` },
    { label: 'Failures', value: String(repairs.length), sublabel: `${completedRepairs.length} resolved` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-background px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{card.value}</p>
          <p className="mt-0.5 text-xs text-text-muted">{card.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
