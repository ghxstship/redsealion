import { Fragment } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { IconCheck } from '@/components/ui/Icons';
import JsonLd from '@/components/marketing/JsonLd';

import { tiers, comparisonData, type FeatureValue } from './_data';
import PricingCards from '@/components/marketing/PricingCards';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'FlyteDeck Pricing',
  description: 'Simple, transparent pricing for experiential production teams.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flytedeck.io' },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://flytedeck.io/pricing' },
    ],
  },
};

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for experiential production teams. Choose Starter, Professional, or Enterprise to match your team size and workflow.',
};

function CellValue({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <IconCheck
        className="mx-auto h-5 w-5 text-zinc-900"
        strokeWidth={2}
        aria-label="Included"
      />
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
      <JsonLd data={jsonLd} />
      {/* Header */}
      <div className="px-8 py-20 text-center lg:px-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">
          Choose the plan that fits your team. Upgrade or downgrade at any time.
        </p>
      </div>

      {/* Pricing Cards with Billing Toggle */}
      <PricingCards tiers={tiers} />

      {/* Feature Comparison Matrix */}
      <div className="mx-auto w-full max-w-5xl px-8 pb-24 lg:px-16">
        <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Compare all features
        </h2>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Table className="w-full border-collapse text-left">
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-white">
                <TableHead className="border-b border-zinc-200 pb-4 pr-4 text-sm font-medium text-zinc-500">
                  Feature
                </TableHead>
                <TableHead className="border-b border-zinc-200 pb-4 text-center text-sm font-medium text-zinc-500">
                  Starter
                </TableHead>
                <TableHead className="border-b border-zinc-200 bg-zinc-50 pb-4 text-center text-sm font-semibold text-zinc-900">
                  Professional
                </TableHead>
                <TableHead className="border-b border-zinc-200 pb-4 text-center text-sm font-medium text-zinc-500">
                  Enterprise
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((category) => (
                <Fragment key={`cat-${category.name}`}>
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="border-b border-zinc-100 pb-3 pt-8 text-sm font-semibold text-zinc-900"
                    >
                      {category.name}
                    </TableCell>
                  </TableRow>
                  {category.features.map((feature, featureIdx) => (
                    <TableRow
                      key={`${category.name}-${feature.name}`}
                      className={featureIdx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
                    >
                      <TableCell className="border-b border-zinc-100 py-3 pr-4 text-sm text-zinc-600">
                        {feature.name}
                      </TableCell>
                      <TableCell className="border-b border-zinc-100 py-3 text-center">
                        <CellValue value={feature.starter} />
                      </TableCell>
                      <TableCell className="border-b border-zinc-100 bg-zinc-50/80 py-3 text-center">
                        <CellValue value={feature.professional} />
                      </TableCell>
                      <TableCell className="border-b border-zinc-100 py-3 text-center">
                        <CellValue value={feature.enterprise} />
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
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
