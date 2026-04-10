import Link from 'next/link';
import type { Metadata } from 'next';
import { IconCheck } from '@/components/ui/Icons';
import JsonLd from '@/components/marketing/JsonLd';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'FlyteDeck vs ClickUp',
  description: 'See why experiential production teams choose FlyteDeck over ClickUp.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://flytedeck.io/compare' },
      { '@type': 'ListItem', position: 3, name: 'ClickUp', item: 'https://flytedeck.io/compare/clickup' },
    ],
  },
};

export const metadata: Metadata = {
  title: "FlyteDeck vs ClickUp — Production-Specific vs Everything-Generic",
  description:
    "ClickUp tries to do everything for everyone, but production teams need purpose-built tools. See why experiential production companies choose FlyteDeck over ClickUp for proposals, budgeting, crew scheduling, and equipment management.",
};

const painPoints = [
  {
    title: 'Feature overload, production underload',
    description:
      'ClickUp ships hundreds of features for every industry. None of them are designed for production workflows. You spend more time configuring custom fields, statuses, and automations than actually managing your productions.',
  },
  {
    title: 'Budgets require custom field gymnastics',
    description:
      'ClickUp has no native budgeting. Tracking estimates against actuals means building a fragile system of custom fields, formulas, and roll-ups that break when someone adds a task in the wrong list. Real financial visibility stays out of reach.',
  },
  {
    title: 'No venue or equipment management',
    description:
      'Productions revolve around venues and gear. ClickUp has no venue database, no equipment inventory, no check-in and check-out tracking, and no way to see which assets are deployed across concurrent events.',
  },
  {
    title: 'No proposal builder or client portal',
    description:
      'You cannot build a branded proposal in ClickUp. You cannot send a client a polished portal where they review options and approve. Guest access exposes your messy internal workspace instead of a curated client experience.',
  },
];

const comparisonRows = [
  { dimension: 'Proposal creation', spreadsheet: 'Docs with manual formatting', flyteDeck: 'Purpose-built step-by-step proposal builder' },
  { dimension: 'Phase-based budgeting', spreadsheet: 'Custom fields and formulas', flyteDeck: 'Native phased budgets with real-time burn tracking' },
  { dimension: 'Crew call sheets', spreadsheet: 'Not supported', flyteDeck: 'Auto-generated call sheets from crew assignments' },
  { dimension: 'Equipment check-in and check-out', spreadsheet: 'No asset management', flyteDeck: 'Full equipment lifecycle with status and location' },
  { dimension: 'Client portal', spreadsheet: 'Guest access to internal spaces', flyteDeck: 'White-label client portal with approval workflows' },
  { dimension: 'Venue management', spreadsheet: 'No venue features', flyteDeck: 'Venue database with contacts, specs, and event history' },
  { dimension: 'Invoice generation', spreadsheet: 'Requires third-party integration', flyteDeck: 'One-click invoices from approved proposal line items' },
  { dimension: 'Production workflow', spreadsheet: 'Generic statuses and views', flyteDeck: 'Pre-built workflow from pitch through wrap and billing' },
  { dimension: 'Document generation', spreadsheet: 'ClickUp Docs only', flyteDeck: 'Branded DOCX and PDF proposals, invoices, and reports' },
  { dimension: 'Profitability tracking', spreadsheet: 'Build custom dashboards manually', flyteDeck: 'Live margin tracking per project, phase, and client' },
];

const dayOneGains = [
  'A production platform that works out of the box with no weeks of configuration required',
  'A proposal builder that turns your line items into branded, client-ready documents',
  'Phase-based budgets that track actuals automatically as your team logs costs',
  'Crew scheduling with availability, conflict detection, and call sheet generation',
  'Equipment tracking from warehouse to venue with check-in, check-out, and maintenance logs',
  'A white-label client portal that keeps stakeholders informed without exposing your internal workspace',
];

export default function ClickUpComparisonPage() {
  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <nav className="px-8 pt-8 lg:px-16" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <li><Link href="/" className="transition-colors hover:text-zinc-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/compare" className="transition-colors hover:text-zinc-600">Compare</Link></li>
          <li>/</li>
          <li className="text-zinc-600">ClickUp</li>
        </ol>
      </nav>

      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          ClickUp does everything except production
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
          ClickUp is a feature-rich productivity platform that tries to replace
          every tool. But trying to do everything means nothing is purpose-built.
          Production teams need phased budgets, crew call sheets, equipment
          tracking, branded proposals, and a client portal — not another week of
          configuring custom fields. FlyteDeck delivers all of it from day one.
        </p>
      </div>

      {/* Pain Points */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          The ClickUp configuration trap
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h3 className="text-base font-semibold text-zinc-900">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-10 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          ClickUp vs FlyteDeck
        </h2>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Capability
                </th>
                <th className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  ClickUp
                </th>
                <th className="border-b border-zinc-200 bg-zinc-50 pb-4 pl-4 text-sm font-semibold text-zinc-900">
                  FlyteDeck
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={row.dimension}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
                >
                  <td className="border-b border-zinc-100 py-3 pr-4 text-sm font-medium text-zinc-900">
                    {row.dimension}
                  </td>
                  <td className="border-b border-zinc-100 py-3 pr-4 text-sm text-zinc-500">
                    {row.spreadsheet}
                  </td>
                  <td className="border-b border-zinc-100 bg-zinc-50/80 py-3 pl-4 text-sm font-medium text-zinc-700">
                    {row.flyteDeck}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Layout */}
        <div className="space-y-4 lg:hidden">
          {comparisonRows.map((row) => (
            <div
              key={row.dimension}
              className="rounded-lg border border-zinc-100 bg-white p-4"
            >
              <p className="mb-3 text-sm font-semibold text-zinc-900">
                {row.dimension}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    ClickUp
                  </p>
                  <p className="text-sm text-zinc-500">{row.spreadsheet}</p>
                </div>
                <div className="rounded bg-zinc-50 p-2">
                  <p className="mb-1 text-xs font-semibold text-zinc-600">FlyteDeck</p>
                  <p className="text-sm font-medium text-zinc-700">{row.flyteDeck}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What You Get on Day One */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-20 lg:px-16">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          What you get on day one
        </h2>
        <ul className="space-y-3">
          {dayOneGains.map((gain) => (
            <li key={gain} className="flex items-start gap-3">
              <IconCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400"
                strokeWidth={2}
              />
              <span className="text-sm leading-relaxed text-zinc-600">{gain}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mx-auto w-full max-w-4xl px-8 pb-24 lg:px-16">
        <div className="rounded-2xl bg-zinc-900 p-10 text-center sm:p-14">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Trade configuration for production
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
            FlyteDeck replaces the endless ClickUp customization with a platform
            that understands production from day one. Proposals, budgets, crew,
            equipment, and client management — all purpose-built. Start a free
            trial and skip the setup marathon.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              Start Free Trial
            </Link>
            <Link
              href="/features"
              className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              See All Features
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
