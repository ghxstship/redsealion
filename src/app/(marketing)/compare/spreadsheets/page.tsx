import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "XPB vs Spreadsheets & Email — Why Production Teams Switch",
  description:
    "Still using spreadsheets and email to manage proposals and production? See why experiential production teams switch to XPB for proposals, budgeting, and client management.",
};

const painPoints = [
  {
    title: 'Version control chaos',
    description:
      'Proposal_v3_FINAL_revised(2).xlsx is not a version control system. Teams waste hours reconciling conflicting spreadsheets, and the wrong version inevitably reaches the client.',
  },
  {
    title: 'No client-facing view',
    description:
      'Spreadsheets were never meant to be shared with clients. You end up copy-pasting into decks, PDFs, or emails — creating another layer of manual work and another place for errors.',
  },
  {
    title: 'Manual budget tracking',
    description:
      'Tracking actuals against estimates means maintaining parallel spreadsheets, manually updating formulas, and hoping nothing breaks. One misplaced cell reference and your numbers are wrong.',
  },
  {
    title: 'Zero visibility into profitability',
    description:
      'By the time you know whether a project was profitable, it is already over. Spreadsheets give you historical data at best — never real-time insight into burn rate or margin.',
  },
];

const comparisonRows = [
  { dimension: 'Proposal creation', spreadsheet: 'Copy-paste into PDF or deck', xpb: 'Interactive drag-and-drop builder' },
  { dimension: 'Client sharing', spreadsheet: 'Email back and forth', xpb: 'Branded client portal with approvals' },
  { dimension: 'Budget tracking', spreadsheet: 'Manual formulas across sheets', xpb: 'Real-time burn tracking against estimates' },
  { dimension: 'Invoice generation', spreadsheet: 'Manually create in accounting tool', xpb: 'One-click invoices from approved proposals' },
  { dimension: 'Time tracking', spreadsheet: 'Separate tool or honor system', xpb: 'Built-in timesheets tied to projects' },
  { dimension: 'Resource scheduling', spreadsheet: 'Shared calendar or whiteboard', xpb: 'Visual resource planner with capacity view' },
  { dimension: 'Version control', spreadsheet: 'Filename suffixes and email chains', xpb: 'Automatic versioning with full history' },
  { dimension: 'Client communication', spreadsheet: 'Scattered across inboxes', xpb: 'Centralized thread per project' },
  { dimension: 'Reporting', spreadsheet: 'Build your own pivot tables', xpb: 'Pre-built dashboards and custom reports' },
  { dimension: 'Profitability analysis', spreadsheet: 'Post-mortem guesswork', xpb: 'Live margin tracking per project' },
];

const dayOneGains = [
  'A single source of truth for every proposal, budget, and client interaction',
  'Professional, branded proposals you can build in minutes instead of hours',
  'A client portal where stakeholders review, comment, and approve — no email chains',
  'Real-time budget tracking that updates as costs are logged',
  'Pipeline visibility so you always know what is closing and when',
  'Invoicing that flows directly from approved proposals',
  'Reports that answer "are we profitable?" without a spreadsheet marathon',
];

export default function SpreadsheetsComparisonPage() {
  return (
    <>
      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          You have outgrown spreadsheets
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
          Spreadsheets and email are fine when you are managing one or two projects.
          But experiential production demands more: complex proposals with multiple
          scenarios, real-time budget tracking, client-facing deliverables, and
          visibility across your entire pipeline. XPB is built for exactly that.
        </p>
      </div>

      {/* The Spreadsheet Trap */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          The spreadsheet trap
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
          Spreadsheets & Email vs XPB
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
                  Spreadsheets & Email
                </th>
                <th className="border-b border-zinc-200 bg-zinc-50 pb-4 pl-4 text-sm font-semibold text-zinc-900">
                  XPB
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
                    {row.xpb}
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
                    Spreadsheets
                  </p>
                  <p className="text-sm text-zinc-500">{row.spreadsheet}</p>
                </div>
                <div className="rounded bg-zinc-50 p-2">
                  <p className="mb-1 text-xs font-semibold text-zinc-600">XPB</p>
                  <p className="text-sm font-medium text-zinc-700">{row.xpb}</p>
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
            Stop managing productions in spreadsheets
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            XPB replaces the patchwork of spreadsheets, email threads, and
            disconnected tools with a single platform built for experiential
            production. Start a free trial and see the difference in your first proposal.
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
