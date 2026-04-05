import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Production Software for Concerts & Festivals | FlyteDeck',
  description:
    'Coordinate large-scale music events with crew call sheets, equipment tracking, multi-stage scheduling, and vendor management. Built for the pace of live music production.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Production Software for Concerts & Festivals',
  description: 'Coordinate large-scale music events with FlyteDeck.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Use Cases', item: 'https://flytedeck.io/use-cases' },
      { '@type': 'ListItem', position: 3, name: 'Concerts & Festivals', item: 'https://flytedeck.io/use-cases/concerts-festivals' },
    ],
  },
};

const painPoints = [
  {
    title: 'Multi-stage, multi-vendor chaos',
    description:
      'Festival productions coordinate dozens of vendors, multiple stages, and hundreds of crew simultaneously. When AV, lighting, staging, and backline vendors all operate on different timelines with different contacts, critical details get lost and costs spiral without visibility.',
  },
  {
    title: 'Crew scheduling across long days and tight changeovers',
    description:
      'Concert and festival crews work extended shifts with tight changeover windows between acts. Managing call times, break compliance, rate cards, and overtime across large crews using spreadsheets leads to payroll disputes and exhausted teams.',
  },
  {
    title: 'Equipment tracking across venues and tours',
    description:
      'Gear moves between warehouses, rehearsal spaces, trucks, and venues constantly. Without centralized asset tracking, equipment goes missing, maintenance windows are missed, and rental costs multiply when you cannot confirm what you already own.',
  },
];

const features = [
  {
    title: 'Multi-stage production planning',
    description:
      'Create proposals and budgets organized by stage, tent, or zone. Each area gets its own deliverables, crew requirements, equipment lists, and timeline. Roll everything up into a single project budget with real-time margin visibility across the entire event.',
  },
  {
    title: 'Crew call sheets and shift management',
    description:
      'Generate crew call sheets with call times, roles, stage assignments, and contact information. Track shift hours, detect scheduling conflicts, and manage overtime calculations. Crew members receive booking notifications and can confirm availability directly.',
  },
  {
    title: 'Equipment check-in/check-out with condition tracking',
    description:
      'Track every piece of equipment from warehouse to truck to stage and back. Record condition at check-out and check-in, flag maintenance needs, and maintain a complete deployment history for insurance and depreciation records.',
  },
  {
    title: 'Vendor coordination and purchase orders',
    description:
      'Manage vendor proposals, compare quotes, issue purchase orders, and track deliverables against the approved budget. Every vendor interaction is documented with a clear audit trail from initial quote through final invoice reconciliation.',
  },
  {
    title: 'Live budget tracking during the event',
    description:
      'As costs come in during the event — overtime, last-minute rentals, emergency purchases — log them against the approved budget in real time. Know exactly where you stand financially at any moment, not two weeks after wrap when the invoices pile up.',
  },
];

const workflowSteps = [
  { label: 'Event Brief', description: 'Define venues, stages, dates, and headcount' },
  { label: 'Proposal & Budget', description: 'Build multi-stage budgets with vendor quotes' },
  { label: 'Advance', description: 'Coordinate site visits, permits, and logistics' },
  { label: 'Crew Booking', description: 'Book crew, generate call sheets, confirm shifts' },
  { label: 'Load-In', description: 'Track equipment deployment and stage builds' },
  { label: 'Show Days', description: 'Manage live costs, crew hours, and on-site changes' },
  { label: 'Strike', description: 'Coordinate teardown, equipment return, and damage reports' },
  { label: 'Wrap & Settle', description: 'Reconcile budgets, process payroll, generate reports' },
];

export default function ConcertsFestivalsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li><Link href="/" className="transition-colors hover:text-zinc-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/use-cases" className="transition-colors hover:text-zinc-600">Use Cases</Link></li>
          <li>/</li>
          <li className="text-zinc-600">Concerts & Festivals</li>
        </ol>
      </nav>

      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Built for concert and festival production teams
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Live music production operates at a pace and scale that generic project management
            tools were never designed for. From multi-stage festival grounds to single-venue
            concert runs, your team juggles vendor coordination, crew scheduling, equipment
            logistics, and live budget tracking — all under the pressure of show day. FlyteDeck
            gives music production teams purpose-built tools to manage the full lifecycle from
            advance through settlement.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">The challenges live music teams face</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">Show day doesn&apos;t wait for your spreadsheet to catch up. These are the problems FlyteDeck eliminates.</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {painPoints.map((point) => (
              <div key={point.title} className="rounded-2xl border border-zinc-200 bg-white p-8">
                <h3 className="text-lg font-semibold text-zinc-900">{point.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">How FlyteDeck solves it</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">A single platform for the entire production lifecycle — from the first site visit to final settlement.</p>
          <div className="mt-12 space-y-12">
            {features.map((feature, index) => (
              <div key={feature.title} className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">{index + 1}</div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{feature.title}</h3>
                  <p className="mt-2 leading-relaxed text-zinc-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">From advance to settlement</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">FlyteDeck covers every phase of concert and festival production.</p>
          <div className="mt-12 overflow-x-auto">
            <div className="flex min-w-max items-start gap-0">
              {workflowSteps.map((step, index) => (
                <div key={step.label} className="flex items-start">
                  <div className="flex w-36 flex-col items-center text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">{index + 1}</div>
                    <h3 className="mt-3 text-sm font-semibold text-zinc-900">{step.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{step.description}</p>
                  </div>
                  {index < workflowSteps.length - 1 && <div className="mt-5 h-px w-8 bg-zinc-300" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Start managing shows with FlyteDeck</h2>
          <p className="mt-4 text-lg text-zinc-600">Join production teams running concerts and festivals on a platform built for the demands of live music.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
            <Link href="/use-cases" className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">View all use cases</Link>
          </div>
        </div>
      </section>
    </>
  );
}
