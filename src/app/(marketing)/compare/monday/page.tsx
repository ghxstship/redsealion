import Link from 'next/link';
import type { Metadata } from 'next';
import { IconCheck } from '@/components/ui/Icons';
import JsonLd from '@/components/marketing/JsonLd';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'FlyteDeck vs Monday.com',
  description: 'See why experiential production teams choose FlyteDeck over Monday.com.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://flytedeck.io/compare' },
      { '@type': 'ListItem', position: 3, name: 'Monday.com', item: 'https://flytedeck.io/compare/monday' },
    ],
  },
};

export const metadata: Metadata = {
  title: "FlyteDeck vs Monday.com — Purpose-Built Production Management",
  description:
    "Monday.com is a general work OS, but experiential production demands specialized tools. See why production teams choose FlyteDeck over Monday for proposals, budgeting, crew scheduling, and client management.",
};

const painPoints = [
  {
    title: 'Generic boards, not production phases',
    description:
      'Monday boards are designed for general project tracking. They have no concept of production phases like pre-production, load-in, show day, and strike. You end up hacking together boards that still do not reflect how your team actually works.',
  },
  {
    title: 'No proposal or budget workflow',
    description:
      'Monday has no proposal builder, no phased budgeting, and no way to generate a branded DOCX or PDF for your client. You are stuck building proposals outside Monday and tracking budgets with number columns that lack real financial logic.',
  },
  {
    title: 'No client portal or approval flow',
    description:
      'Sharing a Monday board with a client means exposing your internal workspace or paying for guest seats. There is no dedicated client portal where stakeholders review proposals, leave comments, and approve deliverables.',
  },
  {
    title: 'No crew or equipment management',
    description:
      'Monday has no crew scheduling with availability, no call sheet generation, and no equipment inventory with check-in and check-out tracking. Production teams are forced to manage these critical workflows in separate tools.',
  },
];

const comparisonRows = [
  { dimension: 'Proposal creation', spreadsheet: 'No built-in proposal builder', flyteDeck: 'Step-by-step proposal builder with templates' },
  { dimension: 'Client portal', spreadsheet: 'Guest seats on internal boards', flyteDeck: 'Branded client portal with review and approval' },
  { dimension: 'Phased budgeting', spreadsheet: 'Number columns without financial structure', flyteDeck: 'Phase-based budgets with real-time burn tracking' },
  { dimension: 'Crew scheduling', spreadsheet: 'People column with no availability view', flyteDeck: 'Visual crew planner with availability and conflicts' },
  { dimension: 'Equipment tracking', spreadsheet: 'Not supported natively', flyteDeck: 'Full equipment lifecycle with check-in and check-out' },
  { dimension: 'DOCX and PDF generation', spreadsheet: 'Export board to spreadsheet only', flyteDeck: 'One-click branded proposal and invoice documents' },
  { dimension: 'Venue management', spreadsheet: 'No venue or location features', flyteDeck: 'Venue database with contacts, specs, and history' },
  { dimension: 'Invoice generation', spreadsheet: 'Requires third-party integration', flyteDeck: 'Invoices generated directly from approved proposals' },
  { dimension: 'Production phases', spreadsheet: 'Generic status columns', flyteDeck: 'Purpose-built phase workflow from pitch to wrap' },
  { dimension: 'Profitability tracking', spreadsheet: 'Build custom dashboards manually', flyteDeck: 'Live margin and profitability per project' },
];

const dayOneGains = [
  'A production-specific workspace that mirrors how your team actually plans and executes events',
  'A proposal builder that creates branded, client-ready documents in minutes',
  'A client portal where stakeholders review, comment, and approve without seeing your internal boards',
  'Crew scheduling with real-time availability so you never double-book talent',
  'Equipment tracking with lifecycle management from warehouse to venue and back',
  'Phased budgets that update automatically as costs are logged against each production stage',
];

export default function MondayComparisonPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li><Link href="/" className="transition-colors hover:text-zinc-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/compare" className="transition-colors hover:text-zinc-600">Compare</Link></li>
          <li>/</li>
          <li className="text-zinc-600">Monday.com</li>
        </ol>
      </nav>

      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Monday.com was not built for production
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
          Monday.com is a powerful work operating system for general project
          management. But experiential production is not general project
          management. You need phased budgets, crew scheduling, equipment
          tracking, branded proposals, and a client portal that keeps
          stakeholders in the loop. FlyteDeck is built for exactly that.
        </p>
      </div>

      {/* Pain Points */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          The Monday.com workaround problem
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
          Monday.com vs FlyteDeck
        </h2>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Table className="w-full border-collapse text-left">
            <TableHeader>
              <TableRow>
                <TableHead className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Capability
                </TableHead>
                <TableHead className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Monday.com
                </TableHead>
                <TableHead className="border-b border-zinc-200 bg-zinc-50 pb-4 pl-4 text-sm font-semibold text-zinc-900">
                  FlyteDeck
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row, idx) => (
                <TableRow
                  key={row.dimension}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
                >
                  <TableCell className="border-b border-zinc-100 py-3 pr-4 text-sm font-medium text-zinc-900">
                    {row.dimension}
                  </TableCell>
                  <TableCell className="border-b border-zinc-100 py-3 pr-4 text-sm text-zinc-500">
                    {row.spreadsheet}
                  </TableCell>
                  <TableCell className="border-b border-zinc-100 bg-zinc-50/80 py-3 pl-4 text-sm font-medium text-zinc-700">
                    {row.flyteDeck}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                    Monday.com
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
              <IconCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400"
                strokeWidth={2}
              />
              <span className="text-sm leading-relaxed text-zinc-600">{gain}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-24 lg:px-16">
        <div className="rounded-2xl bg-zinc-900 p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Stop forcing production into generic boards
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            FlyteDeck replaces the maze of Monday boards, integrations, and
            workarounds with a single platform purpose-built for experiential
            production. Start a free trial and build your first proposal today.
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
