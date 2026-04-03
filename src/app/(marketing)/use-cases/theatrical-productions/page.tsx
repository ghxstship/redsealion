import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Production Software for Theatrical Productions | FlyteDeck',
  description:
    'Plan and produce theatrical shows, touring productions, and performance art with FlyteDeck. Manage set fabrication, rehearsal schedules, multi-city logistics, and production budgets.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Production Software for Theatrical Productions',
  description: 'Plan and produce theatrical shows, touring productions, and performance art with FlyteDeck.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Use Cases', item: 'https://flytedeck.io/use-cases' },
      { '@type': 'ListItem', position: 3, name: 'Theatrical Productions', item: 'https://flytedeck.io/use-cases/theatrical-productions' },
    ],
  },
};

const painPoints = [
  {
    title: 'Long production cycles with shifting budgets',
    description:
      'Theatrical productions can span months from first read-through to opening night. Budgets shift as creative decisions evolve, materials prices change, and design revisions cascade through fabrication, wardrobe, and technical departments. Tracking these changes across disconnected spreadsheets is a recipe for unpleasant surprises at the producer meeting.',
  },
  {
    title: 'Touring logistics multiply complexity',
    description:
      'When a show goes on tour, every aspect of production — sets, props, costumes, equipment, crew — must be planned for multiple venues with different stage dimensions, load-in access, and union requirements. Coordinating shipping, local crew hires, and venue-specific adaptations without a centralized system leads to missed deadlines and blown budgets.',
  },
  {
    title: 'Fabrication tracking across scenic shops',
    description:
      'Theatrical sets involve carpentry, metalwork, painting, soft goods, automation, and props — often produced across multiple scenic shops simultaneously. Tracking build progress, material procurement, delivery schedules, and quality sign-offs across vendors requires more than email threads and phone calls.',
  },
];

const features = [
  {
    title: 'Show-level budgeting with department breakdowns',
    description:
      'Build production budgets organized by department — scenic, costumes, lighting, sound, props, automation — with line items, vendor quotes, and weekly spending tracking. See estimated versus actual costs at the department level and the show level, updated in real time.',
  },
  {
    title: 'Multi-venue touring management',
    description:
      'Plan touring schedules with venue profiles that capture stage dimensions, load-in access, rigging capacity, local crew contacts, and union jurisdictions. Clone and adapt the production plan for each venue, tracking venue-specific costs and logistics separately while maintaining a unified tour budget.',
  },
  {
    title: 'Fabrication phase tracking with milestone gates',
    description:
      'Break scenic fabrication into phases — design approval, material procurement, construction, finishing, load-out — with milestone gates between each. Track progress at the individual scenic element level. Know which pieces are on schedule and which are at risk before they become critical path problems.',
  },
  {
    title: 'Rehearsal and tech schedule management',
    description:
      'Plan rehearsal schedules, technical rehearsals, and preview performances with crew call assignments, space bookings, and department requirements. Track hours for payroll and overtime compliance. Generate daily call sheets that reflect the latest schedule changes.',
  },
  {
    title: 'Asset tracking for props, costumes, and scenic elements',
    description:
      'Catalog every prop, costume piece, and scenic element with photos, condition reports, storage locations, and deployment history. When a show closes or a tour leg ends, know exactly what is going into storage, what needs repair, and what can be reused for the next production.',
  },
];

const workflowSteps = [
  { label: 'Pre-Production', description: 'Design development, budgeting, vendor selection' },
  { label: 'Fabrication', description: 'Scenic builds, costume construction, props' },
  { label: 'Load-In', description: 'Set install, rigging, lighting hang and focus' },
  { label: 'Tech Rehearsals', description: 'Cue-to-cue, tech runs, dress rehearsals' },
  { label: 'Previews', description: 'Preview performances with notes and adjustments' },
  { label: 'Run', description: 'Open run with weekly cost tracking and maintenance' },
  { label: 'Close / Tour', description: 'Strike, storage, or adapt for touring venues' },
];

export default function TheatricalProductionsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li><Link href="/" className="transition-colors hover:text-zinc-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/use-cases" className="transition-colors hover:text-zinc-600">Use Cases</Link></li>
          <li>/</li>
          <li className="text-zinc-600">Theatrical Productions</li>
        </ol>
      </nav>

      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Built for theatrical production teams
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Theatrical productions — from Off-Broadway premieres to multi-city touring shows —
            require meticulous coordination across scenic fabrication, costume construction,
            technical departments, rehearsal schedules, and venue logistics. FlyteDeck gives
            production managers, general managers, and technical directors a single platform
            to build show budgets, track fabrication progress, manage touring logistics, and
            maintain asset inventories across the full lifecycle of a production.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">The challenges theatrical teams face</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">The curtain goes up whether you are ready or not. These are the production management problems FlyteDeck solves.</p>
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
          <p className="mt-4 max-w-2xl text-zinc-600">Purpose-built for the way theatrical productions actually work — from first design meeting through closing night.</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">From pre-production to close</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">FlyteDeck supports the full theatrical production lifecycle.</p>
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Start managing theatrical productions with FlyteDeck</h2>
          <p className="mt-4 text-lg text-zinc-600">Join production teams running shows on a platform built for the complexity of live theatre.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
            <Link href="/use-cases" className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">View all use cases</Link>
          </div>
        </div>
      </section>
    </>
  );
}
