import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Proposal & Production Software for Brand Activations | XPB',
  description:
    'Build interactive proposals, manage budgets, and run brand activation projects from pitch to wrap with XPB. Purpose-built software for experiential marketing teams.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Proposal & Production Software for Brand Activations',
  description:
    'Build interactive proposals, manage budgets, and run brand activation projects from pitch to wrap with XPB.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://xpb.io',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Use Cases',
        item: 'https://xpb.io/use-cases',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Brand Activations',
        item: 'https://xpb.io/use-cases/brand-activations',
      },
    ],
  },
};

const painPoints = [
  {
    title: 'Scattered tools and fragmented workflows',
    description:
      'Brand activation teams juggle spreadsheets for budgets, email threads for approvals, shared drives for creative assets, and yet another tool for scheduling. Information gets lost between platforms, version control becomes a nightmare, and your team wastes hours each week just trying to find the latest version of a proposal or budget.',
  },
  {
    title: 'Manual budgeting that invites errors',
    description:
      'Building activation budgets in spreadsheets means manual formulas, copy-paste errors, and zero visibility into how actuals compare to estimates until the project is already over budget. When a client requests a change mid-production, recalculating margins across line items is tedious and error-prone.',
  },
  {
    title: 'Client communication gaps',
    description:
      'Clients want to see progress, approve creative directions, and sign off on budgets without wading through email chains. Without a dedicated client portal, your team fields constant status-update requests, approval cycles drag on, and miscommunication leads to costly rework on-site.',
  },
];

const features = [
  {
    title: 'Interactive proposals with mood boards',
    description:
      'Build visually compelling proposals that showcase your creative vision. Embed mood boards, reference images, and concept renders directly into your proposal alongside line-item pricing. Clients see the full picture before they sign off, reducing revision cycles and accelerating approvals.',
  },
  {
    title: 'Per-activation budgeting',
    description:
      'Create detailed budgets for each activation with categorized line items, markup calculations, and real-time margin tracking. When scope changes, update a line item and watch totals, margins, and client-facing pricing recalculate instantly. Compare estimated versus actual costs as the project progresses.',
  },
  {
    title: 'Venue management with load-in and strike',
    description:
      'Track venue details, load-in schedules, and strike timelines for every activation. Attach floor plans, note access restrictions, and share venue logistics with your crew and vendors. Everyone arrives knowing exactly where to go and what to expect.',
  },
  {
    title: 'Client portal for real-time approvals',
    description:
      'Give clients a branded portal where they can review proposals, approve budgets, comment on creative concepts, and track project milestones. Every approval is timestamped and logged, creating a clear audit trail that protects both sides.',
  },
  {
    title: 'Post-event profitability analysis',
    description:
      'After the activation wraps, generate profitability reports that compare your original estimate to actual costs. Identify which line items came in over or under budget, understand your true margins, and use the data to price future activations more accurately.',
  },
];

const workflowSteps = [
  { label: 'Brief Received', description: 'Client brief lands in your inbox and gets logged in XPB' },
  { label: 'Proposal Built', description: 'Build a visual proposal with budget, mood boards, and timeline' },
  { label: 'Client Approval', description: 'Client reviews and approves via the branded portal' },
  { label: 'Production', description: 'Manage vendors, crew, and procurement against the approved budget' },
  { label: 'Load-In', description: 'Coordinate venue access, deliveries, and setup schedules' },
  { label: 'Activation', description: 'Track live costs, time entries, and on-site changes' },
  { label: 'Strike', description: 'Manage teardown logistics and return schedules' },
  { label: 'Wrap Report', description: 'Generate profitability reports and client wrap documentation' },
];

export default function BrandActivationsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li>
            <Link href="/" className="transition-colors hover:text-zinc-600">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/use-cases" className="transition-colors hover:text-zinc-600">Use Cases</Link>
          </li>
          <li>/</li>
          <li className="text-zinc-600">Brand Activations</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Built for brand activation teams
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Brand activations are high-stakes, fast-moving projects that demand precision
            at every stage. From the initial client brief through creative concepting,
            vendor coordination, on-site execution, and post-event analysis, your team
            needs a platform that keeps pace. XPB gives experiential marketing and brand
            activation teams a single workspace to build compelling proposals, manage
            production budgets, coordinate venue logistics, and deliver wrap reports that
            prove ROI.
          </p>
          <div className="mt-8">
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            The problems brand activation teams face every day
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            If your team is still stitching together spreadsheets, email chains, and
            shared drives to run activations, you are leaving money and time on the table.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-zinc-200 bg-white p-8"
              >
                <h3 className="text-lg font-semibold text-zinc-900">{point.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How XPB Solves It */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            How XPB solves it
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            XPB replaces the patchwork of tools that brand activation teams typically rely
            on with a single, purpose-built platform designed for experiential production
            workflows.
          </p>
          <div className="mt-12 space-y-12">
            {features.map((feature, index) => (
              <div key={feature.title} className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-zinc-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Timeline */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            From brief to debrief
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            XPB supports your entire brand activation workflow. Every stage is tracked,
            documented, and visible to the people who need to see it.
          </p>
          <div className="mt-12 overflow-x-auto">
            <div className="flex min-w-max items-start gap-0">
              {workflowSteps.map((step, index) => (
                <div key={step.label} className="flex items-start">
                  <div className="flex w-36 flex-col items-center text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-zinc-900">
                      {step.label}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {step.description}
                    </p>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="mt-5 h-px w-8 bg-zinc-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Start managing brand activations with XPB
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Join experiential production teams who have replaced their spreadsheet-and-email
            workflows with a single platform built for the way brand activations actually
            work. Start your free trial today and build your first proposal in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Start free trial
            </Link>
            <Link
              href="/use-cases"
              className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              View all use cases
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
