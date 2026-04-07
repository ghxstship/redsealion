'use client';

import { createContext, useContext, useMemo } from 'react';
import { canAccessFeature, type AppTier, type FeatureKey } from '@/lib/subscription';

interface SubscriptionContextValue {
  tier: AppTier;
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
  tier: AppTier;
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
