import { UpgradePrompt } from '@/components/shared/UpgradePrompt';
import type { FeatureKey } from '@/lib/subscription';
import { IconLock } from '@/components/ui/Icons';

/**
 * Catch-all page for portal routes that don't have dedicated demo pages.
 * Shows the appropriate tier-gated upgrade prompt based on the URL segment.
 */

interface PortalCatchAllProps {
  params: Promise<{ orgSlug: string; rest: string[] }>;
}

// Map URL segments to FeatureKey + tier
const segmentMap: Record<string, { feature: FeatureKey; tier: 'starter' | 'professional' | 'enterprise' }> = {
  resources: { feature: 'resource_scheduling', tier: 'enterprise' },
  templates: { feature: 'templates', tier: 'starter' },
  dispatch: { feature: 'work_orders', tier: 'enterprise' },
  people: { feature: 'people_hr', tier: 'enterprise' },
  crew: { feature: 'crew', tier: 'professional' },
  equipment: { feature: 'equipment', tier: 'professional' },
  assets: { feature: 'assets', tier: 'starter' },
  warehouse: { feature: 'warehouse', tier: 'enterprise' },
  portfolio: { feature: 'portfolio', tier: 'starter' },
  terms: { feature: 'terms', tier: 'starter' },
  expenses: { feature: 'expenses', tier: 'enterprise' },
  budgets: { feature: 'budgets', tier: 'enterprise' },
  profitability: { feature: 'profitability', tier: 'enterprise' },
  time: { feature: 'time_tracking', tier: 'enterprise' },
  automations: { feature: 'automations', tier: 'professional' },
  integrations: { feature: 'integrations', tier: 'professional' },
  emails: { feature: 'email_inbox', tier: 'professional' },
  campaigns: { feature: 'email_campaigns', tier: 'professional' },
  ai: { feature: 'ai_assistant', tier: 'enterprise' },
  settings: { feature: 'billing', tier: 'starter' },
};

export default async function PortalCatchAllPage({ params }: PortalCatchAllProps) {
  const { rest } = await params;
  const segment = rest?.[0] ?? '';

  const mapping = segmentMap[segment];

  if (mapping) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <UpgradePrompt feature={mapping.feature} requiredTier={mapping.tier} />
      </div>
    );
  }

  // Unknown segment — generic upgrade prompt
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary">
        <IconLock className="text-text-muted" strokeWidth={1.5} size={24} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        Premium Feature
      </h3>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        This feature is available on paid plans. Start a free trial to unlock the full FlyteDeck experience.
      </p>
    </div>
  );
}
