import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPB vs Productive.io — Comparison for Production Companies',
  description:
    "Comparing XPB and Productive.io for experiential and creative production management. See how XPB's interactive proposals, client portal, and production-specific tools compare.",
};

const xpbAdvantages = [
  {
    title: 'Interactive proposal builder with drag-and-drop',
    description:
      'XPB provides a purpose-built proposal builder where production teams drag and drop line items, group sections, and create polished, client-ready proposals without touching a design tool. Productive.io does not have an equivalent interactive proposal experience.',
  },
  {
    title: 'White-label client portal',
    description:
      'XPB includes a fully branded client portal where clients review proposals, approve line items, track project progress, and access deliverables. The portal carries your branding, not XPB\'s — making every client interaction feel professional and on-brand.',
  },
  {
    title: 'Venue management with load-in and strike',
    description:
      'Experiential production revolves around venues. XPB includes a venue database with load-in and strike scheduling, venue-specific requirements, and the ability to tie venue details directly to proposals and project timelines.',
  },
  {
    title: 'Proposal scenarios for A/B pricing',
    description:
      'XPB lets teams create multiple pricing scenarios within a single proposal — for example, a standard package and a premium package. Clients see both options side by side and can approve the one that fits their budget, eliminating back-and-forth on pricing.',
  },
  {
    title: 'Asset library with cross-referencing to terms',
    description:
      'XPB maintains a centralized asset library where teams store reusable proposal components, standard terms, and production templates. Assets cross-reference to terms and conditions, ensuring consistency and compliance across every proposal.',
  },
];

const productiveAdvantages = [
  {
    title: 'More mature time tracking UX',
    description:
      'Productive.io has invested years in refining its time tracking interface. The experience is polished, with features like automatic time suggestions and a well-designed weekly timesheet view that many teams find efficient.',
  },
  {
    title: 'Broader agency focus beyond experiential',
    description:
      'Productive.io serves a wider range of agency types — digital, creative, consulting, and more. If your company handles work beyond experiential production, Productive.io\'s broader feature set may cover more of your needs.',
  },
  {
    title: 'Longer market presence',
    description:
      'Productive.io has been in the market longer and has a larger existing user base. This means more community resources, case studies, and established workflows that teams can reference during evaluation.',
  },
];

const comparisonRows = [
  { dimension: 'Interactive proposals', productive: 'Basic deal/quote creation', xpb: 'Drag-and-drop builder with scenarios' },
  { dimension: 'Client portal', productive: 'Limited client access', xpb: 'White-label branded portal' },
  { dimension: 'Proposal scenarios', productive: 'Not available', xpb: 'A/B pricing within proposals' },
  { dimension: 'Venue management', productive: 'Not available', xpb: 'Venue database with load-in/strike' },
  { dimension: 'Asset library', productive: 'Basic docs storage', xpb: 'Reusable assets with terms cross-referencing' },
  { dimension: 'Time tracking', productive: 'Mature, polished UX', xpb: 'Built-in with project cost allocation' },
  { dimension: 'Resource scheduling', productive: 'Available', xpb: 'Crew scheduling with capacity planning' },
  { dimension: 'Budget tracking', productive: 'Project budgets with forecasting', xpb: 'Real-time burn tracking per project' },
  { dimension: 'Invoicing', productive: 'Available', xpb: 'Deposit-balance-final billing cycle' },
  { dimension: 'Profitability analysis', productive: 'Available', xpb: 'Live margin tracking per project and client' },
  { dimension: 'CRM & pipeline', productive: 'Sales pipeline (deals)', xpb: 'Production-focused pipeline with deal tracking' },
  { dimension: 'Integrations', productive: 'QuickBooks, Xero, Zapier, HubSpot', xpb: 'Salesforce, HubSpot, QuickBooks, Xero, ClickUp, Asana' },
  { dimension: 'Task management', productive: 'Full task and project management', xpb: 'Kanban, Gantt, and Calendar views' },
  { dimension: 'Custom fields', productive: 'Available', xpb: 'Available with production-specific defaults' },
  { dimension: 'Target audience', productive: 'All agency types', xpb: 'Experiential production companies' },
];

export default function ProductiveIoComparisonPage() {
  return (
    <>
      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          XPB vs Productive.io
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
          Both XPB and Productive.io help production teams manage projects,
          track budgets, and handle billing. This is a fair comparison to help
          you decide which platform fits your workflow. The right choice depends
          on whether you need a general agency tool or a platform built
          specifically for experiential production.
        </p>
      </div>

      {/* Where XPB Leads */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Where XPB leads
        </h2>
        <div className="space-y-4">
          {xpbAdvantages.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="text-base font-semibold text-zinc-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Where Productive.io Leads */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Where Productive.io leads
        </h2>
        <div className="space-y-4">
          {productiveAdvantages.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
            >
              <h3 className="text-base font-semibold text-zinc-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Feature comparison
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
                  Productive.io
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
                    {row.productive}
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
                    Productive.io
                  </p>
                  <p className="text-sm text-zinc-500">{row.productive}</p>
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

      {/* Built for Experiential */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Built specifically for experiential
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Productive.io is a capable platform that serves many agency types —
            digital, consulting, creative, and more. That breadth is a strength
            for generalist agencies. But it also means the platform is not
            optimized for the specific workflows that experiential production
            companies depend on.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            XPB is purpose-built for experiential production. Every feature —
            from venue management and load-in/strike scheduling to activation
            dates and production-specific billing — is designed for the way
            production teams actually work. There is no need to configure a
            generic tool to fit your workflow. XPB already speaks your language.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-24 lg:px-16">
        <div className="rounded-2xl bg-zinc-900 p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            See if XPB is right for your production team
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            The best way to compare is to try it. Start a free trial and build
            your first proposal in minutes. No credit card required.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/compare"
              className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              View All Comparisons
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
