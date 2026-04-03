import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare FlyteDeck — See How We Stack Up',
  description:
    'Compare FlyteDeck to spreadsheets, generic project management tools, and Productive.io. See why experiential production teams choose FlyteDeck for proposals, budgets, and client management.',
};

const comparisons = [
  {
    title: 'FlyteDeck vs Spreadsheets & Email',
    description:
      'Spreadsheets and email are where production workflows go to die. See why teams switch to FlyteDeck for proposals, budgeting, and client management.',
    href: '/compare/spreadsheets',
  },
  {
    title: 'FlyteDeck vs Monday, Asana & ClickUp',
    description:
      'Generic project management tools are great for tasks but lack production-specific workflows. See how FlyteDeck fills the gaps.',
    href: '/compare/project-management-tools',
  },
  {
    title: 'FlyteDeck vs Productive.io',
    description:
      'A fair, detailed comparison for production teams evaluating both platforms. See where each tool leads and which fits your workflow.',
    href: '/compare/productive-io',
  },
  {
    title: 'FlyteDeck vs Monday.com',
    description:
      'Monday.com is a general-purpose work OS. See why experiential production teams need purpose-built tools that understand phases, venues, and crew.',
    href: '/compare/monday',
  },
  {
    title: 'FlyteDeck vs Asana',
    description:
      'Asana excels at task management but lacks production-specific features. Compare proposal building, budgeting, and client portals side by side.',
    href: '/compare/asana',
  },
  {
    title: 'FlyteDeck vs ClickUp',
    description:
      'ClickUp offers a broad feature set, but breadth is not depth. See how FlyteDeck provides production-grade workflows that ClickUp cannot replicate.',
    href: '/compare/clickup',
  },
];

export default function ComparePage() {
  return (
    <>
      {/* Hero */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          See how FlyteDeck compares
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-500">
          FlyteDeck is the only platform built specifically for experiential production.
          See how it stacks up against the tools you might be considering.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="mx-auto grid w-full max-w-4xl gap-6 px-8 pb-24 sm:grid-cols-3 lg:px-16">
        {comparisons.map((comparison) => (
          <Link
            key={comparison.href}
            href={comparison.href}
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 transition-[color,background-color,border-color,opacity,box-shadow] hover:border-zinc-300 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 group-hover:text-zinc-700">
              {comparison.title}
            </h2>
            <p className="mt-3 flex-1 text-sm text-zinc-500">
              {comparison.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
              Read comparison
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
