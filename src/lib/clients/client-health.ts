/**
 * Client health scoring engine.
 *
 * Computes a composite health score (0-100) from multiple signals:
 *   - Recency of interaction
 *   - Deal velocity (active deals / conversions)
 *   - Revenue contribution
 *   - Contact coverage (decision-maker identified)
 *   - Proposal activity
 *
 * @module lib/clients/client-health
 */

interface ClientHealthInput {
  /** Number of interactions in the last 90 days. */
  recentInteractions: number;
  /** Date of most recent interaction (ISO string). */
  lastInteractionDate: string | null;
  /** Number of active (open) deals. */
  activeDeals: number;
  /** Number of won deals. */
  wonDeals: number;
  /** Number of lost deals. */
  lostDeals: number;
  /** Total revenue from paid invoices. */
  totalRevenue: number;
  /** Number of contacts on the account. */
  contactCount: number;
  /** Whether at least one decision-maker is identified. */
  hasDecisionMaker: boolean;
  /** Number of proposals (all time). */
  proposalCount: number;
  /** Number of approved/active proposals. */
  activeProposals: number;
}

export interface ClientHealthResult {
  score: number;
  tier: 'excellent' | 'healthy' | 'at-risk' | 'critical';
  signals: Array<{ label: string; impact: 'positive' | 'neutral' | 'negative' }>;
}

export function computeClientHealth(input: ClientHealthInput): ClientHealthResult {
  let score = 50; // Start neutral
  const signals: ClientHealthResult['signals'] = [];

  // 1. Interaction recency (up to +/- 20)
  if (input.lastInteractionDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(input.lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < 7) {
      score += 15;
      signals.push({ label: 'Active engagement (last 7 days)', impact: 'positive' });
    } else if (daysSince < 30) {
      score += 5;
      signals.push({ label: `Last interaction ${daysSince}d ago`, impact: 'neutral' });
    } else if (daysSince < 90) {
      score -= 10;
      signals.push({ label: `No interaction for ${daysSince} days`, impact: 'negative' });
    } else {
      score -= 20;
      signals.push({ label: `Dormant — ${daysSince}+ days since last interaction`, impact: 'negative' });
    }
  } else {
    score -= 15;
    signals.push({ label: 'No interactions recorded', impact: 'negative' });
  }

  // 2. Interaction volume (up to +10)
  if (input.recentInteractions >= 5) {
    score += 10;
    signals.push({ label: `${input.recentInteractions} interactions in 90 days`, impact: 'positive' });
  } else if (input.recentInteractions >= 2) {
    score += 5;
  }

  // 3. Deal health (up to +/- 15)
  if (input.activeDeals > 0) {
    score += 10;
    signals.push({ label: `${input.activeDeals} active deal${input.activeDeals > 1 ? 's' : ''}`, impact: 'positive' });
  }
  if (input.wonDeals > 0) {
    score += 5;
    signals.push({ label: `${input.wonDeals} won deal${input.wonDeals > 1 ? 's' : ''}`, impact: 'positive' });
  }
  if (input.lostDeals > input.wonDeals && input.lostDeals > 0) {
    score -= 10;
    signals.push({ label: 'More deals lost than won', impact: 'negative' });
  }

  // 4. Revenue contribution (up to +10)
  if (input.totalRevenue > 0) {
    score += 5;
    if (input.totalRevenue >= 50000) {
      score += 5;
      signals.push({ label: 'High-value client (≥$50K revenue)', impact: 'positive' });
    }
  }

  // 5. Contact coverage (up to +10)
  if (input.hasDecisionMaker) {
    score += 5;
    signals.push({ label: 'Decision-maker identified', impact: 'positive' });
  } else if (input.contactCount === 0) {
    score -= 5;
    signals.push({ label: 'No contacts on file', impact: 'negative' });
  }

  if (input.contactCount >= 2) {
    score += 5;
    signals.push({ label: 'Multiple contacts mapped', impact: 'positive' });
  }

  // 6. Proposal activity
  if (input.activeProposals > 0) {
    score += 5;
    signals.push({ label: `${input.activeProposals} active proposal${input.activeProposals > 1 ? 's' : ''}`, impact: 'positive' });
  } else if (input.proposalCount === 0) {
    score -= 5;
    signals.push({ label: 'No proposals created', impact: 'negative' });
  }

  // Clamp
  score = Math.min(100, Math.max(0, score));

  const tier: ClientHealthResult['tier'] =
    score >= 80 ? 'excellent' : score >= 60 ? 'healthy' : score >= 35 ? 'at-risk' : 'critical';

  return { score, tier, signals };
}

export const HEALTH_TIER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  excellent: { bg: 'bg-green-100', text: 'text-green-700', label: 'Excellent' },
  healthy: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Healthy' },
  'at-risk': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'At Risk' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
};

export function healthBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-red-500';
}
