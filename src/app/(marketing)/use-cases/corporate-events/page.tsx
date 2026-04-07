import type { Metadata } from 'next';
import Link from 'next/link';
import { IconCheck } from '@/components/ui/Icons';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Corporate Event Production Software | FlyteDeck',
  description:
    'Streamline corporate event production with professional proposals, budget tracking, and client management tools built for production companies serving enterprise clients.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Corporate Event Production Software',
  description:
    'Streamline corporate event production with professional proposals, budget tracking, and client management tools built for production companies.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://flytedeck.io',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Use Cases',
        item: 'https://flytedeck.io/use-cases',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Corporate Events',
        item: 'https://flytedeck.io/use-cases/corporate-events',
      },
    ],
  },
};

const painPoints = [
  {
    title: 'Long approval chains that stall production',
    description:
      'Corporate clients operate with multi-layered approval hierarchies. A proposal might need sign-off from the event manager, the marketing director, procurement, and finance before work can begin. Each handoff introduces delays, and without visibility into where a proposal is stuck, your team cannot proactively move things forward. Weeks of waiting can compress your production timeline to the point where quality suffers.',
  },
  {
    title: 'Compliance and documentation requirements',
    description:
      'Enterprise clients expect detailed documentation — certificates of insurance, W-9 forms, vendor qualification packages, and itemized invoices that match their purchase order formats. They need audit-ready records of every approval, change order, and payment. Meeting these requirements with ad-hoc document management eats into your team time that should be spent on production.',
  },
  {
    title: 'Recurring events with inconsistent processes',
    description:
      'Many corporate clients run the same events annually — sales kickoffs, leadership summits, holiday parties, product launches. Each year the event team starts from scratch because last year\'s budgets, vendor lists, and production notes are buried in old email threads and archived folders. Institutional knowledge walks out the door when team members change roles.',
  },
];

const features = [
  {
    title: 'Professional branded proposals',
    description:
      'Present your production company at its best with polished, branded proposals that match the professionalism your corporate clients expect. FlyteDeck proposals include your logo, brand colors, and custom cover pages alongside detailed scope descriptions, line-item budgets, timeline milestones, and terms and conditions. Export to PDF for procurement teams who need static documents, or share interactive versions through the client portal.',
  },
  {
    title: 'SSO for enterprise clients',
    description:
      'Corporate clients can access the FlyteDeck client portal using their existing enterprise credentials through single sign-on integration. This eliminates the friction of creating separate accounts, satisfies IT security requirements, and makes it easy for multiple stakeholders within the client organization to review proposals and track project progress without managing additional passwords.',
  },
  {
    title: 'Recurring invoice schedules',
    description:
      'Set up automated invoicing schedules that match your corporate client payment terms. Whether you bill monthly retainers, milestone-based payments, or a combination of both, FlyteDeck generates invoices on schedule, tracks payment status, and maintains a complete billing history for each client. Year-end reconciliation and audit support become simple when every invoice is organized and accessible.',
  },
  {
    title: 'Audit trails for every action',
    description:
      'Every proposal revision, budget change, approval, comment, and document upload in FlyteDeck is logged with a timestamp and user identity. When a corporate client needs to trace the history of a decision or verify who approved a change order, the complete audit trail is available instantly. This level of documentation protects both your production company and your client during internal reviews.',
  },
  {
    title: 'Multi-pipeline for different event types',
    description:
      'Corporate production companies often manage several distinct event types simultaneously — conferences, executive retreats, product launches, and internal town halls. FlyteDeck supports multiple project pipelines, each with its own stages, templates, and default settings. Your team sees a clear view of all active projects organized by type, making it easy to manage capacity and prioritize workload across event categories.',
  },
];

export default function CorporateEventsPage() {
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
          <li className="text-zinc-600">Corporate Events</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Professional tools for corporate event production
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Corporate event production demands a level of professionalism, documentation,
            and process rigor that most production tools were not designed to handle. Your
            clients are enterprise organizations with procurement teams, compliance
            requirements, and multi-stakeholder approval chains. FlyteDeck gives corporate event
            production companies the tools to meet those expectations while running
            efficient, profitable operations.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            From annual sales kickoffs and leadership summits to product launches and
            investor events, FlyteDeck helps you deliver polished proposals, maintain transparent
            budgets, and build lasting client relationships through consistent,
            professional service.
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
            The unique demands of corporate event clients
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Corporate clients bring larger budgets but also higher expectations for
            documentation, process, and accountability. Here are the challenges that
            production teams face when serving enterprise organizations.
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

      {/* How FlyteDeck Solves It */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            How FlyteDeck meets enterprise-grade requirements
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            FlyteDeck was built with the understanding that production companies serving corporate
            clients need more than just project management — they need a platform that
            instills confidence in every interaction.
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

      {/* Why Corporate Teams Choose FlyteDeck */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Why corporate event producers choose FlyteDeck
          </h2>
          <div className="mt-8">
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mt-0.5">
                  <IconCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Faster proposal turnaround</h3>
                  <p className="mt-1 text-zinc-500">
                    Clone proposals from previous events to respond to RFPs faster. Your
                    pricing intelligence and production knowledge carry forward from project
                    to project, helping you submit competitive proposals without starting from
                    a blank page every time.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mt-0.5">
                  <IconCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Stronger client relationships</h3>
                  <p className="mt-1 text-zinc-500">
                    The branded client portal gives your corporate clients a premium
                    experience that reinforces your professionalism. Real-time project
                    visibility reduces status-update calls and builds trust through
                    transparency.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mt-0.5">
                  <IconCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Better margins through data</h3>
                  <p className="mt-1 text-zinc-500">
                    Historical project data helps you understand your true costs by event
                    type, client, and venue. Use this intelligence to price future projects
                    more accurately and identify the event categories where your company is
                    most profitable.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 mt-0.5">
                  <IconCheck className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Scalable operations</h3>
                  <p className="mt-1 text-zinc-500">
                    As your client roster grows, FlyteDeck scales with you. Multi-pipeline views,
                    team permissions, and automated workflows ensure your operations stay
                    organized whether you are managing five events a year or fifty.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Elevate your corporate event production
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Give your team the professional tools that corporate clients expect. FlyteDeck helps
            production companies win more enterprise business, execute flawlessly, and build
            the documentation and process rigor that keeps clients coming back year after
            year.
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
