import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Production Software for Film, TV & Broadcast | FlyteDeck',
  description:
    'Manage set builds, location logistics, and production budgets for film, television, and live broadcast projects with FlyteDeck. Track crew, equipment, and wrap reporting in one platform.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Production Software for Film, TV & Broadcast',
  description: 'Manage set builds, location logistics, and production budgets for film, television, and broadcast.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Use Cases', item: 'https://flytedeck.io/use-cases' },
      { '@type': 'ListItem', position: 3, name: 'Film, TV & Broadcast', item: 'https://flytedeck.io/use-cases/film-tv-broadcast' },
    ],
  },
};

const painPoints = [
  {
    title: 'Set builds spanning multiple departments',
    description:
      'Film and TV sets require coordination between art departments, construction crews, lighting, grip, and special effects teams. Each department has its own budget, timeline, and vendor relationships. Without a central platform, cost overruns hide in departmental silos until the production accountant finds them weeks later.',
  },
  {
    title: 'Location logistics across shoot days',
    description:
      'Productions move between locations with different load-in constraints, permit windows, and crew call requirements. Managing the logistics of where to be, when, with what equipment — and communicating changes in real time — requires more than a shared Google Doc.',
  },
  {
    title: 'Crew and equipment turnover between projects',
    description:
      'Film and broadcast crews are largely freelance. Every project means rebuilding your team, negotiating rates, confirming availability, and onboarding crew members who need immediate access to call sheets, schedules, and safety documentation.',
  },
];

const features = [
  {
    title: 'Department-level budgeting with roll-ups',
    description:
      'Create budgets organized by department — art, grip, electric, camera, SFX, wardrobe, locations — with line items, vendor quotes, and purchase orders per department. Roll all departments up into a single top-sheet with real-time actual-versus-estimate tracking.',
  },
  {
    title: 'Location management with permits and logistics',
    description:
      'Track every shooting location with address, permit status, access windows, parking, power availability, and on-site contacts. Attach floor plans, photos, and safety notes. Generate location packages that crew and department heads can reference on the day.',
  },
  {
    title: 'Crew booking with rate cards and availability',
    description:
      'Maintain a crew database with rate cards, skills, certifications, and availability calendars. Book crew members for specific shoot days, generate call sheets with department-specific call times, and handle confirmations and cancellations without email tag.',
  },
  {
    title: 'Equipment tracking across rentals and owned gear',
    description:
      'Track owned equipment and rental reservations side by side. Log check-out and return conditions, maintenance schedules, and rental costs per project. Know exactly what gear is on which truck for which shoot day.',
  },
  {
    title: 'Wrap reports and cost reconciliation',
    description:
      'When production wraps, generate comprehensive cost reports comparing estimated budgets to actuals across every department. Document equipment returns, outstanding vendor invoices, and final crew payments. Build a complete project archive for the studio or financier.',
  },
];

const workflowSteps = [
  { label: 'Development', description: 'Script breakdown, initial budgeting, and key crew' },
  { label: 'Pre-Production', description: 'Location scouts, department budgets, crew booking' },
  { label: 'Build Days', description: 'Set construction, equipment prep, tech rehearsals' },
  { label: 'Production', description: 'Shoot days with live cost tracking and call sheets' },
  { label: 'Wrap', description: 'Set strike, equipment returns, vendor reconciliation' },
  { label: 'Post-Delivery', description: 'Final cost reports, crew payments, archive' },
];

export default function FilmTvBroadcastPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li><Link href="/" className="transition-colors hover:text-zinc-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/use-cases" className="transition-colors hover:text-zinc-600">Use Cases</Link></li>
          <li>/</li>
          <li className="text-zinc-600">Film, TV & Broadcast</li>
        </ol>
      </nav>

      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Built for film, television, and broadcast production
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Film and broadcast productions demand precise coordination between departments,
            locations, crews, and equipment — all under tight timelines and scrutinized
            budgets. FlyteDeck gives production managers, line producers, and art departments
            a central platform to build budgets, book crews, manage locations, track
            equipment, and deliver wrap reports that studios and financiers require.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">The challenges production teams face</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">When every department runs its own tools, the production office loses visibility until it is too late.</p>
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
          <p className="mt-4 max-w-2xl text-zinc-600">One platform for budgets, crew, locations, equipment, and wrap — built for how productions actually run.</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">From development to delivery</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">FlyteDeck supports every phase of film and broadcast production.</p>
          <div className="mt-12 overflow-x-auto">
            <div className="flex min-w-max items-start gap-0">
              {workflowSteps.map((step, index) => (
                <div key={step.label} className="flex items-start">
                  <div className="flex w-40 flex-col items-center text-center">
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Start managing productions with FlyteDeck</h2>
          <p className="mt-4 text-lg text-zinc-600">Join production teams running film, TV, and broadcast projects on a platform built for the industry.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
            <Link href="/use-cases" className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">View all use cases</Link>
          </div>
        </div>
      </section>
    </>
  );
}
