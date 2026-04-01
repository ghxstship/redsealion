const stats = [
  {
    label: 'Total Proposals',
    value: '24',
    detail: '3 this month',
  },
  {
    label: 'Active Projects',
    value: '8',
    detail: '2 starting soon',
  },
  {
    label: 'Revenue Pipeline',
    value: '$142k',
    detail: '+12% from last month',
  },
  {
    label: 'Pending Approvals',
    value: '5',
    detail: '2 urgent',
  },
];

export default function DashboardPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of your business activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white px-5 py-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {stat.detail}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
