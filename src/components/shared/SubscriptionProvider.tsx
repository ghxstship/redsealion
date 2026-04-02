'use client';

import { createContext, useContext, useMemo } from 'react';
import type { SubscriptionTier } from '@/types/database';
import { canAccessFeature, type FeatureKey } from '@/lib/subscription';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  canAccess: (feature: FeatureKey) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  tier: 'free',
  canAccess: () => false,
});

export function SubscriptionProvider({
  tier,
  children,
}: {
  tier: SubscriptionTier;
  children: React.ReactNode;
}) {
  const value = useMemo<SubscriptionContextValue>(
    () => ({
      tier,
      canAccess: (feature: FeatureKey) => canAccessFeature(tier, feature),
    }),
    [tier]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
