'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SubscriptionTier } from '@/types/database';
import { getTierLabel, type FeatureKey } from '@/lib/subscription';
import { useSubscription } from '@/components/shared/SubscriptionProvider';

export function UpgradePrompt({
  feature,
  requiredTier,
}: {
  feature: FeatureKey;
  requiredTier: SubscriptionTier;
}) {
  const tierLabel = getTierLabel(requiredTier);
  const featureLabel = feature.replace(/_/g, ' ');
  const { tier } = useSubscription();
  const pathname = usePathname();

  // Detect portal context for appropriate CTA
  const isPortal = tier === 'portal' || pathname.startsWith('/portal/');
  const portalSlug = isPortal ? pathname.split('/')[2] : null;

  const ctaHref = isPortal
    ? `/portal/${portalSlug}/pricing`
    : '/app/settings/billing';

  const ctaLabel = isPortal
    ? 'Start Free Trial'
    : `Upgrade to ${tierLabel}`;

  const description = isPortal
    ? (
        <>
          <span className="capitalize">{featureLabel}</span> is available on the{' '}
          <span className="font-medium text-foreground">{tierLabel}</span> plan
          and above. Start a free trial to unlock this feature.
        </>
      )
    : (
        <>
          <span className="capitalize">{featureLabel}</span> is available on the{' '}
          <span className="font-medium text-foreground">{tierLabel}</span> plan
          and above. Upgrade to unlock this feature.
        </>
      );

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white px-8 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {tierLabel} Feature
      </h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        {description}
      </p>
      <Link
        href={ctaHref}
        className={`mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors ${
          isPortal
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90'
            : 'bg-foreground hover:bg-foreground/90'
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3v10M3 8l5-5 5 5" />
        </svg>
        {ctaLabel}
      </Link>
    </div>
  );
}
