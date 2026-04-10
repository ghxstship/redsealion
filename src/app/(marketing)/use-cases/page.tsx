import type { Metadata } from 'next';
import Link from 'next/link';
import { IconStar, IconCalendar, IconNavLogistics, IconNavActivations, IconUsers, IconNavAI, IconNavEvents, IconNavProduction, IconNavReports, IconChevronRight } from '@/components/ui/Icons';
import JsonLd from '@/components/marketing/JsonLd';

export const metadata: Metadata = {
  title: 'Use Cases — FlyteDeck for Every Type of Experiential Production',
  description:
    'Discover how FlyteDeck helps experiential production teams manage proposals, budgets, and projects across brand activations, live events, trade shows, immersive experiences, concerts, film and broadcast, theatrical productions, and more.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Use Cases — FlyteDeck for Every Type of Experiential Production',
  description:
    'Discover how FlyteDeck helps experiential production teams manage proposals, budgets, and projects across brand activations, live events, trade shows, pop-up experiences, and corporate events.',
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
    ],
  },
};

const useCases = [
  {
    title: 'Brand Activations',
    href: '/use-cases/brand-activations',
    description:
      'Build interactive proposals, manage budgets, and run brand activation projects from pitch to wrap. Purpose-built tools for experiential marketing campaigns.',
    icon: (
      <IconStar className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Live Events',
    href: '/use-cases/live-events',
    description:
      'Manage live event production from proposal to wrap. Resource scheduling, crew time tracking, budget burn monitoring, and client portals for event producers.',
    icon: (
      <IconCalendar className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Trade Shows & Exhibitions',
    href: '/use-cases/trade-shows',
    description:
      'Proposal builder and project management for trade show and exhibition design firms. Multi-venue coordination, complex BOMs, and streamlined client approvals.',
    icon: (
      <IconNavLogistics className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Pop-Up Experiences',
    href: '/use-cases/pop-up-experiences',
    description:
      'Move from concept to pop-up in record time. Quick proposal builder, automated invoicing, and integrated timeline management for pop-up retail and immersive installations.',
    icon: (
      <IconNavActivations className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Corporate Events',
    href: '/use-cases/corporate-events',
    description:
      'Streamline corporate event production with professional proposals, budget tracking, audit trails, and client management tools built for enterprise requirements.',
    icon: (
      <IconUsers className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Immersive Experiences',
    href: '/use-cases/immersive-experiences',
    description:
      'Produce immersive installations, AR/VR activations, and multi-sensory environments. Manage complex technology integrations, spatial design, and fabrication timelines from a single platform.',
    icon: (
      <IconNavAI className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Concerts & Festivals',
    href: '/use-cases/concerts-festivals',
    description:
      'Coordinate large-scale music events with crew call sheets, equipment tracking, multi-stage scheduling, and vendor management. Built for the pace and complexity of live music production.',
    icon: (
      <IconNavEvents className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Film, TV & Broadcast',
    href: '/use-cases/film-tv-broadcast',
    description:
      'Manage set builds, location logistics, and production budgets for film, television, and live broadcast projects. Track crew schedules, equipment rentals, and wrap reporting in one place.',
    icon: (
      <IconNavProduction className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
  {
    title: 'Theatrical Productions',
    href: '/use-cases/theatrical-productions',
    description:
      'Plan and produce theatrical shows, touring productions, and performance art. Manage set fabrication, rehearsal schedules, multi-city logistics, and production budgets across long run cycles.',
    icon: (
      <IconNavReports className="h-6 w-6" strokeWidth={1.5} />
    ),
  },
];

export default function UseCasesPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="px-8 pb-16 pt-20 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            FlyteDeck for every type of experiential production
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600">
            Whether you produce brand activations, immersive experiences, concerts,
            trade shows, film and broadcast, or theatrical performances, FlyteDeck gives your
            team a single platform to build proposals, manage budgets, schedule resources, and
            keep clients in the loop. Explore how production teams in each vertical use FlyteDeck
            to win more work and deliver projects on time and on budget.
          </p>
        </div>
      </section>

      {/* Use Case Cards */}
      <section className="bg-zinc-50 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <Link
                key={useCase.href}
                href={useCase.href}
                className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-[color,background-color,border-color,opacity,box-shadow] hover:border-zinc-300 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                  {useCase.icon}
                </div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  {useCase.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {useCase.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-900">
                  Learn more
                  <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Ready to streamline your production workflow?
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Join production teams who use FlyteDeck to win more pitches, deliver projects on
            budget, and keep clients happy from first contact to final wrap report.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Start free trial
            </Link>
            <Link
              href="/features"
              className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Explore features
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
