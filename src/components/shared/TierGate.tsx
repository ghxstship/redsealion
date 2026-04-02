'use client';

import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import { getRequiredTier, type FeatureKey } from '@/lib/subscription';

export function TierGate({
  feature,
  children,
  fallback,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canAccess } = useSubscription();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return fallback !== undefined ? (
    <>{fallback}</>
  ) : (
    <UpgradePrompt feature={feature} requiredTier={getRequiredTier(feature)} />
  );
}
