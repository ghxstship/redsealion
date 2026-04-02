import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Trade Show & Exhibition Management Software | XPB',
  description:
    'Proposal builder and project management for trade show and exhibition design firms. Manage venues, budgets, and client approvals in one platform.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Trade Show & Exhibition Management Software',
  description:
    'Proposal builder and project management for trade show and exhibition design firms. Manage venues, budgets, and client approvals.',
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
        name: 'Trade Shows',
        item: 'https://xpb.io/use-cases/trade-shows',
      },
    ],
  },
};

const painPoints = [
  {
    title: 'Multi-venue coordination headaches',
    description:
      'Trade show and exhibition firms often manage booths and installations across multiple venues, cities, and even countries within a single season. Each venue has its own deadlines, labor rules, freight requirements, and floor plans. Coordinating all of this across spreadsheets and email threads is a recipe for missed deadlines and costly mistakes.',
  },
  {
    title: 'Complex bills of materials',
    description:
      'Exhibition builds involve hundreds of individual components — structural elements, graphics, lighting, flooring, furniture, AV equipment, and branded materials. Tracking BOMs across multiple booth designs, managing inventory for reusable components, and reconciling what was ordered versus what was received is overwhelming without a purpose-built system.',
  },
  {
    title: 'Endless revision cycles',
    description:
      'Booth designs go through multiple rounds of revisions as clients refine their messaging, branding, and spatial requirements. Each revision impacts the budget, timeline, and procurement schedule. Without a structured revision workflow, teams waste time recreating proposals from scratch and risk approving outdated versions.',
  },
];

const features = [
  {
    title: 'Multi-venue support with addresses and dates',
    description:
      'Manage an entire trade show season from a single dashboard. Each project in XPB can span multiple venues, each with its own address, show dates, move-in and move-out windows, and venue-specific requirements. Filter your project list by upcoming show dates to prioritize what needs attention now and plan ahead for what is coming next.',
  },
  {
    title: 'Proposal scenarios for booth options',
    description:
      'Present clients with multiple booth options in a single proposal. XPB lets you build side-by-side scenarios — for example, a 20x20 inline booth versus a 30x30 island booth — each with its own budget, layout, and component list. Clients can compare options and approve their preferred scenario without requiring separate proposals for each concept.',
  },
  {
    title: 'Asset library for reusable components',
    description:
      'Build a centralized asset library of reusable booth components, graphic templates, structural elements, and standard furniture packages. When building a new proposal, pull items from your library instead of starting from scratch. Track asset condition, storage location, and depreciation to make smarter decisions about when to refurbish or replace.',
  },
  {
    title: 'Client portal for design approvals',
    description:
      'Share booth designs, renderings, and material samples through a branded client portal. Clients can leave comments directly on design elements, approve stages of the build, and sign off on final layouts. Every interaction is logged with timestamps, eliminating the "I never approved that" conversations that derail projects.',
  },
];

export default function TradeShowsPage() {
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
          <li className="text-zinc-600">Trade Shows</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Trade show management, simplified
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Trade show and exhibition design firms operate in a unique space where creative
            design meets complex logistics. You are building custom environments that need
            to arrive on time, fit the floor plan exactly, reflect the brand perfectly, and
            come in on budget. XPB gives exhibition teams the proposal, budgeting, and
            project management tools they need to manage it all without the chaos.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            From initial client pitch through design iteration, fabrication management,
            shipping coordination, and on-site installation, XPB keeps every stakeholder
            aligned and every detail tracked.
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
            Challenges that trade show teams know too well
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Exhibition production involves a unique combination of creative design, precision
            fabrication, and complex logistics. Generic project management tools cannot keep up.
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
            How XPB transforms trade show production
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            XPB understands the rhythms of trade show production — the seasonal surges, the
            multi-venue juggling, the design revision cycles, and the critical importance of
            getting every detail right before the show floor opens.
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

      {/* Additional Detail Section */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Built for the trade show production lifecycle
          </h2>
          <div className="mt-8 grid gap-12 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Pre-show planning</h3>
              <p className="mt-3 leading-relaxed text-zinc-500">
                Build proposals with detailed budgets, design concepts, and timeline
                milestones. Use XPB to coordinate with subcontractors, order materials, and
                track fabrication progress against deadlines. Automated reminders ensure
                nothing falls through the cracks as show dates approach.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">On-site execution</h3>
              <p className="mt-3 leading-relaxed text-zinc-500">
                Track installation progress, log crew hours, and manage on-site changes
                through XPB. When a client requests a last-minute graphic swap or furniture
                addition, capture the change order and cost impact immediately. Your team
                stays aligned even when things move fast on the show floor.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Post-show wrap-up</h3>
              <p className="mt-3 leading-relaxed text-zinc-500">
                After the show, generate profitability reports, reconcile actual costs
                against estimates, and document lessons learned. XPB makes it easy to create
                post-show summaries that demonstrate the value you delivered and set the
                stage for next season.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Season-over-season growth</h3>
              <p className="mt-3 leading-relaxed text-zinc-500">
                Use historical project data to refine your estimating accuracy, identify your
                most profitable show types, and build stronger proposals for returning
                clients. XPB gives you the data foundation to grow your exhibition business
                strategically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Simplify your trade show operations with XPB
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Stop juggling spreadsheets across venues and start managing your entire
            exhibition season from a single platform. XPB gives trade show teams the tools
            to win more business, execute flawlessly, and grow profitably.
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
