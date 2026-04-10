'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconCheck } from '@/components/ui/Icons';

interface Tier {
  name: string;
  price: string;
  priceAnnual: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
}

export default function PricingCards({ tiers }: { tiers: Tier[] }) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3 pb-12">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-zinc-900' : 'text-zinc-400'}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isAnnual}
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
            isAnnual ? 'bg-zinc-900' : 'bg-zinc-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isAnnual ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isAnnual ? 'text-zinc-900' : 'text-zinc-400'}`}>
          Annual
        </span>
        {isAnnual && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Save ~20%
          </span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-8 pb-24 lg:grid-cols-3 lg:px-16">
        {tiers.map((tier) => {
          const displayPrice = isAnnual ? tier.priceAnnual : tier.price;
          const displayPeriod = tier.period
            ? isAnnual
              ? '/mo, billed annually'
              : tier.period
            : '';

          return (
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
                    {displayPrice}
                  </span>
                  {displayPeriod && (
                    <span
                      className={`text-sm ${tier.featured ? 'text-zinc-400' : 'text-zinc-500'}`}
                    >
                      {displayPeriod}
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
                    <IconCheck
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.featured ? 'text-zinc-400' : 'text-zinc-400'
                      }`}
                      strokeWidth={2}
                    />
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
          );
        })}
      </div>
    </>
  );
}
