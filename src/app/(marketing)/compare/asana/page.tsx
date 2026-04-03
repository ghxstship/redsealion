import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "FlyteDeck vs Asana — From Task Management to Production Management",
  description:
    "Asana is great for task management, but production teams need more than tasks. See why experiential production companies switch to FlyteDeck for proposals, budgeting, invoicing, crew scheduling, and client approvals.",
};

const painPoints = [
  {
    title: 'Flat task lists miss production complexity',
    description:
      'Productions are not a list of tasks. They are multi-phase operations with overlapping timelines, dependent resources, and shifting budgets. Asana task lists and boards flatten this complexity into something that does not match reality.',
  },
  {
    title: 'No budgeting or financial tracking',
    description:
      'Asana has no concept of budgets, cost tracking, or margins. Production teams need to track estimates against actuals across every phase. With Asana you are exporting to spreadsheets to answer basic financial questions.',
  },
  {
    title: 'No invoicing or proposal workflow',
    description:
      'You cannot build a proposal in Asana. You cannot generate an invoice. Every client-facing financial document has to be created in a separate tool, which means duplicated data and manual reconciliation.',
  },
  {
    title: 'No resource or asset scheduling',
    description:
      'Asana assigns people to tasks but has no crew scheduling with availability windows, no equipment inventory, and no way to see resource conflicts across concurrent productions. Scheduling stays in spreadsheets or separate tools.',
  },
];

const comparisonRows = [
  { dimension: 'Proposal creation', spreadsheet: 'Not supported', flyteDeck: 'Drag-and-drop proposal builder with branded output' },
  { dimension: 'Budget tracking', spreadsheet: 'No financial features', flyteDeck: 'Phase-based budgets with real-time actuals' },
  { dimension: 'Invoicing', spreadsheet: 'Requires external tool', flyteDeck: 'One-click invoices from approved proposals' },
  { dimension: 'Crew scheduling', spreadsheet: 'Task assignment only', flyteDeck: 'Visual crew planner with availability and call sheets' },
  { dimension: 'Equipment management', spreadsheet: 'No asset tracking', flyteDeck: 'Equipment lifecycle with check-in, check-out, and maintenance' },
  { dimension: 'Client portal', spreadsheet: 'Guest access to project boards', flyteDeck: 'White-label client portal with approval workflows' },
  { dimension: 'Production phases', spreadsheet: 'Sections and custom fields', flyteDeck: 'Native phase workflow from pre-production through wrap' },
  { dimension: 'Document generation', spreadsheet: 'No document output', flyteDeck: 'Branded DOCX and PDF proposals and invoices' },
  { dimension: 'Profitability analysis', spreadsheet: 'Not available', flyteDeck: 'Live margin tracking per project and per phase' },
  { dimension: 'Pipeline management', spreadsheet: 'Portfolio view for status only', flyteDeck: 'Full pipeline with revenue forecasting and win rates' },
];

const dayOneGains = [
  'A production workspace organized by phases, not just tasks, so your team sees the full picture',
  'Proposals built and sent from the same platform where you manage the project',
  'Budget tracking that lives alongside your production plan with no spreadsheet exports needed',
  'Crew scheduling with real-time availability so double-bookings become impossible',
  'A branded client portal where stakeholders approve proposals and review progress',
  'Invoicing that flows directly from approved line items with no re-entry required',
];

export default function AsanaComparisonPage() {
  return (
    <>
      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Asana manages tasks, not productions
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
          Asana is an excellent task management tool. But experiential
          production is more than tasks. You need proposals with multiple
          scenarios, phased budgets that track actuals, crew and equipment
          scheduling, client approval workflows, and invoicing that ties back to
          what was sold. FlyteDeck handles all of it in one place.
        </p>
      </div>

      {/* Pain Points */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Where Asana falls short for production
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="text-base font-semibold text-zinc-900">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Asana vs FlyteDeck
        </h2>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Capability
                </th>
                <th className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Asana
                </th>
                <th className="border-b border-zinc-200 bg-zinc-50 pb-4 pl-4 text-sm font-semibold text-zinc-900">
                  FlyteDeck
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={row.dimension}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
                >
                  <td className="border-b border-zinc-100 py-3 pr-4 text-sm font-medium text-zinc-900">
                    {row.dimension}
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 text-sm text-zinc-500">
                    {row.spreadsheet}
                  </td>
                  <td className="border-b border-zinc-100 bg-zinc-50/80 py-3 pl-4 text-sm font-medium text-zinc-700">
                    {row.flyteDeck}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Layout */}
        <div className="space-y-4 lg:hidden">
          {comparisonRows.map((row) => (
            <div
              key={row.dimension}
              className="rounded-lg border border-zinc-100 bg-white p-4"
            >
              <p className="mb-3 text-sm font-semibold text-zinc-900">
                {row.dimension}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Asana
                  </p>
                  <p className="text-sm text-zinc-500">{row.spreadsheet}</p>
                </div>
                <div className="rounded bg-zinc-50 p-2">
                  <p className="mb-1 text-xs font-semibold text-zinc-600">FlyteDeck</p>
                  <p className="text-sm font-medium text-zinc-700">{row.flyteDeck}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What You Get on Day One */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          What you get on day one
        </h2>
        <ul className="space-y-3">
          {dayOneGains.map((gain) => (
            <li key={gain} className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              <span className="text-sm leading-relaxed text-zinc-600">{gain}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-24 lg:px-16">
        <div className="rounded-2xl bg-zinc-900 p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Move beyond task management
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            FlyteDeck gives your production team everything Asana does not:
            proposals, budgets, invoicing, crew scheduling, equipment tracking,
            and a client portal. Start a free trial and see the difference in
            your first project.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/features"
              className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              See All Features
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
