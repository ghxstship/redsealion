import Link from 'next/link';
import type { Metadata } from 'next';

import { tiers, comparisonData, type FeatureValue } from './_data';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for experiential production teams. Choose Starter, Professional, or Enterprise to match your team size and workflow.',
};

function CellValue({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <svg
        className="mx-auto h-5 w-5 text-zinc-900"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-label="Included"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    );
  }
  if (value === false) {
    return <span className="text-zinc-300" aria-label="Not included">&mdash;</span>;
  }
  return <span className="text-sm text-zinc-700">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">
          Choose the plan that fits your team. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-8 pb-24 lg:grid-cols-3 lg:px-16">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-2xl border p-8 ${
              tier.featured
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <div className="mb-6">
              <h3
                className={`text-sm font-semibold uppercase tracking-wider ${
                  tier.featured ? 'text-zinc-300' : 'text-zinc-500'
                }`}
              >
                {tier.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  className={`text-4xl font-semibold tracking-tight ${
                    tier.featured ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    className={`text-sm ${tier.featured ? 'text-zinc-400' : 'text-zinc-500'}`}
                  >
                    {tier.period}
                  </span>
                )}
              </div>
              <p
                className={`mt-3 text-sm ${tier.featured ? 'text-zinc-400' : 'text-zinc-500'}`}
              >
                {tier.description}
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <svg
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      tier.featured ? 'text-zinc-400' : 'text-zinc-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  <span
                    className={`text-sm ${tier.featured ? 'text-zinc-300' : 'text-zinc-600'}`}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={`block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                tier.featured
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="mx-auto w-full max-w-5xl px-8 pb-24 lg:px-16">
        <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Compare all features
        </h2>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="sticky top-0 z-10 bg-white">
                <th className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Feature
                </th>
                <th className="border-b border-zinc-200 pb-4 text-center text-sm font-medium text-zinc-500">
                  Starter
                </th>
                <th className="border-b border-zinc-200 bg-zinc-50 pb-4 text-center text-sm font-semibold text-zinc-900">
                  Professional
                </th>
                <th className="border-b border-zinc-200 pb-4 text-center text-sm font-medium text-zinc-500">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((category) => (
                <>
                  <tr key={`cat-${category.name}`}>
                    <td
                      colSpan={4}
                      className="border-b border-zinc-100 pb-3 pt-8 text-sm font-semibold text-zinc-900"
                    >
                      {category.name}
                    </td>
                  </tr>
                  {category.features.map((feature, featureIdx) => (
                    <tr
                      key={`${category.name}-${feature.name}`}
                      className={featureIdx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
                    >
                      <td className="border-b border-zinc-100 py-3 pr-4 text-sm text-zinc-600">
                        {feature.name}
                      </td>
                      <td className="border-b border-zinc-100 py-3 text-center">
                        <CellValue value={feature.starter} />
                      </td>
                      <td className="border-b border-zinc-100 bg-zinc-50/80 py-3 text-center">
                        <CellValue value={feature.professional} />
                      </td>
                      <td className="border-b border-zinc-100 py-3 text-center">
                        <CellValue value={feature.enterprise} />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Layout */}
        <div className="space-y-8 lg:hidden">
          {comparisonData.map((category) => (
            <div key={category.name}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900">
                {category.name}
              </h3>
              <div className="space-y-3">
                {category.features.map((feature) => (
                  <div
                    key={`${category.name}-${feature.name}`}
                    className="rounded-lg border border-zinc-100 bg-white p-4"
                  >
                    <p className="mb-3 text-sm font-medium text-zinc-900">{feature.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="mb-1 text-xs text-zinc-400">Starter</p>
                        <CellValue value={feature.starter} />
                      </div>
                      <div className="rounded bg-zinc-50 py-1">
                        <p className="mb-1 text-xs font-medium text-zinc-500">Pro</p>
                        <CellValue value={feature.professional} />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-zinc-400">Enterprise</p>
                        <CellValue value={feature.enterprise} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
