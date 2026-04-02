import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'FlyteDeck vs Monday, Asana & ClickUp — Built for Production, Not Just Projects',
  description:
    "Generic project management tools weren't built for experiential production. Compare FlyteDeck to Monday.com, Asana, and ClickUp for managing proposals, budgets, and creative projects.",
};

const gaps = [
  {
    title: 'No proposal builder',
    description:
      'Monday, Asana, and ClickUp have no concept of interactive proposals. You still need a separate tool to build, price, and share client-facing proposals.',
  },
  {
    title: 'No production billing',
    description:
      'Generic PM tools track tasks, not money. They cannot generate invoices, track deposits, or handle the deposit-balance-final billing cycle that production companies rely on.',
  },
  {
    title: 'No client portal',
    description:
      'Sharing a board link is not a client portal. Production clients need a branded space to review proposals, approve line items, and track project progress without seeing your internal workflow.',
  },
  {
    title: 'No resource utilization for crew',
    description:
      'Assigning a person to a task is not resource scheduling. Production teams need to see crew availability across projects, manage day rates, and plan capacity weeks in advance.',
  },
  {
    title: 'No profitability tracking',
    description:
      'PM tools measure task completion, not profit margins. They cannot tell you whether a project is on budget, what your blended margin is, or which clients are most profitable.',
  },
];

const comparisonRows = [
  { dimension: 'Interactive proposals', pm: 'Not available', flyteDeck: 'Drag-and-drop builder with scenarios' },
  { dimension: 'Production-specific billing', pm: 'Not available', flyteDeck: 'Deposit, balance, and final invoicing' },
  { dimension: 'Client portal', pm: 'Share a board link (not branded)', flyteDeck: 'White-label portal with approvals' },
  { dimension: 'Venue management', pm: 'Not available', flyteDeck: 'Venue database with load-in/strike scheduling' },
  { dimension: 'Budget & profitability', pm: 'Build your own with add-ons', flyteDeck: 'Real-time burn tracking and margin analysis' },
  { dimension: 'Resource scheduling', pm: 'Basic workload views', flyteDeck: 'Crew scheduling with capacity planning' },
  { dimension: 'Time tracking', pm: 'Built-in or add-on', flyteDeck: 'Built-in with project cost allocation' },
  { dimension: 'CRM & pipeline', pm: 'Build your own or integrate', flyteDeck: 'Purpose-built sales pipeline with deal tracking' },
  { dimension: 'Integrations', pm: 'Extensive marketplace', flyteDeck: 'Salesforce, HubSpot, QuickBooks, Xero, ClickUp, Asana' },
  { dimension: 'Custom fields', pm: 'Available', flyteDeck: 'Available with production-specific defaults' },
];

export default function PMToolsComparisonPage() {
  return (
    <>
      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Generic PM tools don&apos;t understand production
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
          Monday.com, Asana, and ClickUp are excellent task management platforms.
          But experiential production is not just tasks. It is proposals, budgets,
          client approvals, venue logistics, crew scheduling, and billing — none
          of which generic PM tools handle out of the box. FlyteDeck is built specifically
          for production workflows.
        </p>
      </div>

      {/* What's Missing */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          What is missing from generic PM tools
        </h2>
        <div className="space-y-4">
          {gaps.map((gap) => (
            <div
              key={gap.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="text-base font-semibold text-zinc-900">
                {gap.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {gap.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Generic PM Tools vs FlyteDeck
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
                  Monday / Asana / ClickUp
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
                    {row.pm}
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
                    PM Tools
                  </p>
                  <p className="text-sm text-zinc-500">{row.pm}</p>
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

      {/* Best of Both Worlds */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Best of both worlds
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            You do not have to choose between FlyteDeck and your existing PM tool.
            FlyteDeck integrates directly with ClickUp and Asana, so your production
            workflows live in FlyteDeck while tasks sync automatically to the tools
            your team already uses. Proposals, budgets, and client approvals
            happen in FlyteDeck. Task execution happens wherever your team is most
            comfortable.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            FlyteDeck also connects to Salesforce and HubSpot for CRM, and QuickBooks
            and Xero for accounting — giving production teams a unified workflow
            without forcing anyone to abandon the tools they rely on.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-24 lg:px-16">
        <div className="rounded-2xl bg-zinc-900 p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Purpose-built for production teams
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            FlyteDeck gives experiential production companies the workflows that
            generic PM tools cannot: interactive proposals, production billing,
            client portals, crew scheduling, and profitability tracking — all
            in one platform.
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
