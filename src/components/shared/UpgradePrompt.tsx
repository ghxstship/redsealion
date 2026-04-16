'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, ArrowUp } from 'lucide-react';
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

  // Detect portal context via pathname — no longer relies on a 'portal' tier value
  const isPortal = pathname.startsWith('/portal/');
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
    <div data-testid="upgrade-prompt" className="flex flex-col items-center justify-center rounded-xl border border-border bg-background px-8 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
        <Lock size={24} className="text-text-muted" />
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
        <ArrowUp size={16} />
        {ctaLabel}
      </Link>
    </div>
  );
}
