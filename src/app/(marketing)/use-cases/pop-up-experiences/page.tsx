import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Software for Pop-Up Retail & Immersive Experiences | FlyteDeck',
  description:
    'Build proposals and manage pop-up retail activations, immersive installations, and experiential marketing with FlyteDeck. Fast turnaround tools for experience producers.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Software for Pop-Up Retail & Immersive Experiences',
  description:
    'Build proposals and manage pop-up retail activations, immersive installations, and experiential marketing with FlyteDeck.',
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
        name: 'Pop-Up Experiences',
        item: 'https://flytedeck.io/use-cases/pop-up-experiences',
      },
    ],
  },
};

const painPoints = [
  {
    title: 'Fast turnarounds that leave no room for error',
    description:
      'Pop-up experiences often go from concept to opening day in weeks, not months. That compressed timeline means there is no margin for miscommunication, missed procurement deadlines, or budget surprises. Every delay cascades through the entire project, and there is no time to recover from mistakes that a better system would have prevented.',
  },
  {
    title: 'Multiple stakeholders with competing priorities',
    description:
      'Pop-up projects involve brand teams, creative agencies, landlords, permitting authorities, fabricators, and sometimes retail operations teams. Each stakeholder has different information needs, different approval authority, and different timelines. Managing all of these relationships through email and phone calls creates communication bottlenecks that slow everything down.',
  },
  {
    title: 'Tight budgets with no room to absorb surprises',
    description:
      'Pop-up experiences are often funded from marketing budgets with fixed allocations. There is rarely a contingency reserve to absorb unexpected costs. When a permit fee is higher than expected or a material substitution is needed, producers need to know immediately how it impacts the overall budget and where to find offsetting savings.',
  },
];

const features = [
  {
    title: 'Quick proposal builder',
    description:
      'Build polished, professional proposals in minutes, not hours. FlyteDeck provides templates designed for experiential production that include space for creative concepts, budget breakdowns, timeline milestones, and venue requirements. Clone proposals from previous pop-ups and adjust for the new project, carrying forward your pricing intelligence and operational knowledge from past experiences.',
  },
  {
    title: 'Automated invoicing',
    description:
      'Set up milestone-based or schedule-based invoicing when the project kicks off. FlyteDeck automatically generates invoices at the agreed intervals, tracks payment status, and sends reminders when payments are overdue. Producers spend less time on accounts receivable and more time on production. When scope changes occur, new line items flow automatically into the next invoice cycle.',
  },
  {
    title: 'Real-time client approvals',
    description:
      'Share proposals, design concepts, and budget updates through a branded client portal. Clients can review, comment, and approve without downloading attachments or navigating complex software. Push notifications alert stakeholders when their input is needed, and automatic reminders keep approval cycles moving. Every approval is logged with a timestamp and the approver identity for a complete audit trail.',
  },
  {
    title: 'Integrated timeline management',
    description:
      'Map out every phase of your pop-up build with clear milestones and dependencies. From lease signing and permitting through fabrication, delivery, installation, operation, and deinstallation, every task lives on a shared timeline. Team members see exactly what needs to happen next, and project managers get early warning when any milestone is at risk of slipping.',
  },
];

export default function PopUpExperiencesPage() {
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
          <li className="text-zinc-600">Pop-Up Experiences</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            From concept to pop-up in record time
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Pop-up retail spaces, immersive brand installations, and temporary experiential
            environments demand speed without sacrificing quality. Your team needs to move
            from a creative brief to a fully operational experience in weeks, coordinating
            design, fabrication, permitting, and logistics on a compressed timeline. FlyteDeck
            gives pop-up production teams the tools to move fast, stay organized, and
            deliver on budget.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Whether you are building a two-day brand pop-up, a month-long immersive retail
            experience, or a traveling installation that visits multiple cities, FlyteDeck keeps
            your proposals professional, your budgets transparent, and your stakeholders
            aligned.
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
            Why pop-up production is uniquely challenging
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Pop-up experiences combine the complexity of construction projects with the
            timelines of marketing campaigns. The tools built for either world alone
            cannot handle both.
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
            How FlyteDeck accelerates pop-up production
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            FlyteDeck is purpose-built for the speed and complexity of experiential production.
            Every feature is designed to eliminate friction and keep your pop-up project
            moving forward.
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

      {/* Use Case Details */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Types of pop-up experiences FlyteDeck supports
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">Pop-up retail</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Temporary retail environments that bring brands to life in unexpected
                locations. Manage lease agreements, build-out budgets, staffing schedules,
                and visual merchandising plans from a single platform. Track sales
                performance against activation costs to measure true ROI.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">Immersive installations</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Multi-sensory experiences that require careful coordination between
                technology vendors, scenic fabricators, and content creators. FlyteDeck helps you
                manage the complex interdependencies between these disciplines and keep
                everyone working toward the same opening date.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">Traveling experiences</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Experiences that move from city to city, adapting to different venues while
                maintaining brand consistency. Use FlyteDeck to manage multi-city logistics,
                track per-market budgets, and coordinate local vendors at each stop while
                maintaining a master timeline for the entire tour.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-zinc-900">Brand activations at festivals</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                High-energy brand presence at music festivals, sporting events, and cultural
                gatherings. Manage the unique challenges of festival environments including
                power constraints, weather contingencies, and high foot traffic with FlyteDeck
                production tools designed for fast-paced on-site execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Launch your next pop-up with confidence
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Stop losing time to scattered tools and manual processes. FlyteDeck gives pop-up
            production teams a single platform to build proposals, manage budgets, coordinate
            stakeholders, and deliver unforgettable experiences on time and on budget.
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
