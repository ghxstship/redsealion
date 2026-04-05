import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Production Software for Immersive Experiences | FlyteDeck',
  description:
    'Produce immersive installations, AR/VR activations, and multi-sensory environments with FlyteDeck. Manage technology integrations, spatial design, fabrication timelines, and client approvals in one platform.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Production Software for Immersive Experiences',
  description:
    'Produce immersive installations, AR/VR activations, and multi-sensory environments with FlyteDeck.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Use Cases', item: 'https://flytedeck.io/use-cases' },
      { '@type': 'ListItem', position: 3, name: 'Immersive Experiences', item: 'https://flytedeck.io/use-cases/immersive-experiences' },
    ],
  },
};

const painPoints = [
  {
    title: 'Technology complexity with no central tracker',
    description:
      'Immersive projects layer projection mapping, spatial audio, haptic feedback, motion sensors, and custom software into a single environment. Without a central platform, tracking which vendor owns which integration, what firmware version is deployed, and how hardware dependencies cascade becomes unmanageable.',
  },
  {
    title: 'Fabrication and digital timelines out of sync',
    description:
      'Physical builds and digital content development operate on different timelines with different teams. When a fabrication delay pushes back the install window, the content team needs to know immediately. Spreadsheets and Slack channels fail to create this visibility.',
  },
  {
    title: 'Client sign-off on abstract concepts',
    description:
      'Immersive experiences are hard to describe on paper. Clients struggle to visualize spatial layouts, interaction flows, and sensory design from static documents. This leads to late-stage scope changes that blow budgets and compress timelines.',
  },
];

const features = [
  {
    title: 'Multi-discipline proposals with tech specs',
    description:
      'Build proposals that integrate creative concepts, spatial layouts, technology specifications, and fabrication line items into a single document. Clients see the full picture — what the experience looks and feels like, what technology powers it, and what it costs — before they commit.',
  },
  {
    title: 'Phased production with dependency tracking',
    description:
      'Break immersive projects into phases — concept, prototyping, fabrication, integration, testing, install — with milestone gates between each. Track dependencies between hardware procurement, software development, and physical construction so nothing falls through the cracks.',
  },
  {
    title: 'Equipment and asset lifecycle management',
    description:
      'Track projectors, LED panels, sensors, media servers, and custom hardware from procurement through deployment, storage, and reuse across installations. Know where every piece of equipment is, what condition it is in, and when it was last maintained.',
  },
  {
    title: 'Interactive client portal with spatial previews',
    description:
      'Give clients a branded portal where they can explore proposed layouts, review creative references and mood boards, comment on specific design elements, and approve budgets. Every interaction is logged for accountability.',
  },
  {
    title: 'Post-installation analytics and wrap reporting',
    description:
      'After the installation opens, generate wrap reports that compare estimated versus actual costs, document equipment deployed, and create asset inventories for future reuse. Build institutional knowledge from every project.',
  },
];

const workflowSteps = [
  { label: 'Creative Brief', description: 'Capture the vision, audience, and spatial constraints' },
  { label: 'Concept Design', description: 'Build mood boards, tech specs, and spatial layouts' },
  { label: 'Prototype', description: 'Test interactions, content, and hardware integrations' },
  { label: 'Fabrication', description: 'Track builds, procurements, and vendor deliverables' },
  { label: 'Integration', description: 'Merge physical and digital elements, system testing' },
  { label: 'Install', description: 'Coordinate load-in, calibration, and final commissioning' },
  { label: 'Live', description: 'Monitor on-site, track costs, manage crew shifts' },
  { label: 'Decommission', description: 'Strike, asset recovery, and wrap reporting' },
];

export default function ImmersiveExperiencesPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li><Link href="/" className="transition-colors hover:text-zinc-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/use-cases" className="transition-colors hover:text-zinc-600">Use Cases</Link></li>
          <li>/</li>
          <li className="text-zinc-600">Immersive Experiences</li>
        </ol>
      </nav>

      <section className="px-8 pb-16 pt-12 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Built for immersive experience producers
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Immersive experiences sit at the intersection of technology, design, and
            fabrication. Every project layers custom hardware, spatial audio, projection
            mapping, interactive software, and physical construction into environments that
            transport audiences. FlyteDeck gives immersive production teams a single platform
            to scope complex technology stacks, coordinate multi-discipline teams, manage
            equipment lifecycles, and deliver on creative visions that defy easy description.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">The challenges immersive teams face</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            When your deliverable is an entire environment, the production complexity
            multiplies. These are the problems FlyteDeck was designed to solve.
          </p>
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
          <p className="mt-4 max-w-2xl text-zinc-600">
            FlyteDeck replaces the patchwork of tools immersive teams cobble together with
            a purpose-built platform that understands multi-phase, multi-discipline production.
          </p>
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">From concept to decommission</h2>
          <p className="mt-4 max-w-2xl text-zinc-600">
            FlyteDeck tracks every phase of an immersive production, from the first creative
            brief through installation, live operation, and teardown.
          </p>
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Start producing immersive experiences with FlyteDeck</h2>
          <p className="mt-4 text-lg text-zinc-600">
            Join production teams building the world&apos;s most ambitious immersive environments.
            Start your free trial and build your first proposal in minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800">Start free trial</Link>
            <Link href="/use-cases" className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">View all use cases</Link>
          </div>
        </div>
      </section>
    </>
  );
}
