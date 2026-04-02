import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Event Production Management Software | FlyteDeck',
  description:
    'Manage live event production from proposal to wrap. Time tracking, resource scheduling, budgeting, and client portals for event producers.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Event Production Management Software',
  description:
    'Manage live event production from proposal to wrap. Time tracking, resource scheduling, budgeting, and client portals for event producers.',
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
        name: 'Live Events',
        item: 'https://flytedeck.io/use-cases/live-events',
      },
    ],
  },
};

const painPoints = [
  {
    title: 'Complex crew scheduling',
    description:
      'Live events require dozens of crew members across multiple departments — audio, lighting, video, staging, rigging, and more. Coordinating availability, managing shift overlaps, and handling last-minute replacements across spreadsheets leads to double-bookings, understaffed shifts, and frantic phone calls the night before load-in.',
  },
  {
    title: 'Budget overruns that surface too late',
    description:
      'Event budgets are living documents that change constantly. Equipment substitutions, overtime hours, rush freight charges, and weather-related contingencies pile up. Without real-time budget tracking, producers often discover they are over budget only after the event wraps and invoices start arriving.',
  },
  {
    title: 'Last-minute changes with no paper trail',
    description:
      'Clients change their minds on-site. A speaker is added, a set piece needs to be reconfigured, or a breakout room requires AV at the last minute. Without a structured change-order process, these additions slip through the cracks, never get invoiced, and erode your margins on every show.',
  },
];

const features = [
  {
    title: 'Resource scheduling with utilization heat maps',
    description:
      'See your entire crew and equipment roster at a glance. FlyteDeck displays utilization heat maps that highlight overbooked periods and underutilized resources, helping you staff events efficiently and avoid burnout. Drag-and-drop scheduling makes it easy to reassign crew members when availability changes.',
  },
  {
    title: 'Time tracking for crew',
    description:
      'Crew members log hours directly in FlyteDeck, capturing regular time, overtime, and travel time by department and role. Producers get real-time visibility into labor costs against budget, and payroll exports are generated automatically at the end of each event.',
  },
  {
    title: 'Change order management and invoicing',
    description:
      'When a client requests an on-site change, create a change order in FlyteDeck with a few taps. The system calculates the cost impact, captures the client approval, and automatically adds the charges to the next invoice. No more lost revenue from undocumented scope changes.',
  },
  {
    title: 'Gantt charts for event timelines',
    description:
      'Map out every phase of your event production with interactive Gantt charts. From pre-production milestones through load-in, rehearsals, show days, and strike, every task is visible on a shared timeline. Dependencies are tracked automatically, so when one task slips, downstream tasks adjust.',
  },
  {
    title: 'Real-time budget burn tracking',
    description:
      'Monitor your budget in real time as costs are incurred. FlyteDeck tracks committed costs, actual spend, and remaining budget across every line item. Dashboard views show budget burn rate alongside project timeline progress, giving producers early warning when a project is trending over budget.',
  },
];

const stats = [
  {
    value: '23%',
    label: 'fewer budget overruns',
    description: 'Teams using FlyteDeck report 23% fewer budget overruns compared to spreadsheet-based tracking, thanks to real-time cost visibility and automated variance alerts.',
  },
  {
    value: '4.2 hrs',
    label: 'saved per event on admin',
    description: 'Producers save an average of 4.2 hours per event on administrative tasks like crew scheduling, time aggregation, and invoice preparation.',
  },
  {
    value: '91%',
    label: 'client approval rate on first pass',
    description: 'Interactive proposals with embedded timelines and visual layouts achieve a 91% first-pass approval rate, reducing revision cycles by half.',
  },
];

export default function LiveEventsPage() {
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
          <li className="text-zinc-600">Live Events</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Run live event production without the chaos
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Live event production is a high-wire act. Dozens of crew members, hundreds of
            line items, tight timelines, and clients who expect flawless execution every
            time. FlyteDeck is the production management platform that gives event producers
            real-time control over budgets, schedules, and client communications so you can
            focus on delivering extraordinary experiences instead of chasing spreadsheets.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Whether you are producing conferences, concerts, galas, awards shows, or
            multi-day festivals, FlyteDeck adapts to your workflow and scales with your business.
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
            Why event production teams struggle with generic tools
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Project management software built for software teams or general contractors
            does not understand the realities of live event production. Here is what falls
            through the cracks.
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
            How FlyteDeck keeps your productions on track
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            FlyteDeck was designed from the ground up for experiential production workflows. Every
            feature is built to handle the fast pace, shifting scope, and high stakes of
            live event work.
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

      {/* Stats */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            The impact of switching to FlyteDeck
          </h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Production teams that move from spreadsheets and generic project tools to FlyteDeck
            see measurable improvements across their operations.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-white p-8"
              >
                <p className="text-4xl font-bold text-zinc-900">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                  {stat.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Bring order to your event production workflow
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Stop fighting your tools and start producing events with confidence. FlyteDeck gives
            you real-time budget visibility, streamlined crew scheduling, and a client
            portal that keeps everyone aligned. Start your free trial and see the difference
            in your next show.
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
