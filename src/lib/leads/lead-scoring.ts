/**
 * Rules-based lead scoring engine.
 *
 * Computes a 0–100 score for a lead using weighted signals:
 *   - Contact completeness (email, phone)
 *   - Budget presence and magnitude
 *   - Lead source quality
 *   - Recency of submission
 *   - Status progression
 *
 * @module lib/leads/lead-scoring
 */

interface LeadScoreInput {
  contact_email: string | null;
  contact_phone: string | null;
  estimated_budget: number | null;
  source: string;
  status: string;
  created_at: string;
  company_name?: string | null;
  message?: string | null;
}

interface LeadScoreResult {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  signals: string[];
}

// ─── Source Quality Weights ──────────────────────────────────────────────────

const SOURCE_WEIGHTS: Record<string, number> = {
  referral: 20,
  event: 15,
  linkedin: 15,
  website: 12,
  lead_form: 12,
  cold_outreach: 3,
  other: 2,
};

// ─── Scoring Function ────────────────────────────────────────────────────────

export function computeLeadScore(lead: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const signals: string[] = [];

  // 1. Contact completeness
  if (lead.contact_email) {
    score += 15;
    signals.push('Email provided');
  }
  if (lead.contact_phone) {
    score += 10;
    signals.push('Phone provided');
  }
  if (lead.company_name) {
    score += 5;
    signals.push('Company identified');
  }

  // 2. Budget signals
  if (lead.estimated_budget != null && lead.estimated_budget > 0) {
    score += 15;
    signals.push('Budget provided');

    if (lead.estimated_budget >= 50000) {
      score += 10;
      signals.push('High-value budget (≥$50K)');
    } else if (lead.estimated_budget >= 10000) {
      score += 5;
      signals.push('Mid-range budget (≥$10K)');
    }
  }

  // 3. Source quality
  const sourceWeight = SOURCE_WEIGHTS[lead.source] ?? 5;
  score += sourceWeight;
  if (sourceWeight >= 15) {
    signals.push(`High-quality source: ${lead.source}`);
  }

  // 4. Recency
  const ageMs = Date.now() - new Date(lead.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays < 1) {
    score += 15;
    signals.push('Submitted today');
  } else if (ageDays < 7) {
    score += 10;
    signals.push('Submitted this week');
  } else if (ageDays < 30) {
    score += 5;
    signals.push('Submitted this month');
  }

  // 5. Status progression
  const statusScores: Record<string, number> = {
    new: 0,
    contacted: 5,
    qualified: 10,
    converted: 15,
    lost: 0,
  };
  const statusBonus = statusScores[lead.status] ?? 0;
  if (statusBonus > 0) {
    score += statusBonus;
    signals.push(`Status: ${lead.status.replace(/_/g, ' ')}`);
  }

  // 6. Message/context provided
  if (lead.message && lead.message.length > 20) {
    score += 5;
    signals.push('Detailed message provided');
  }

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score));

  // Determine tier
  const tier: LeadScoreResult['tier'] =
    score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

  return { score, tier, signals };
}

/**
 * Get CSS classes for a score tier badge.
 */
export function scoreTierClasses(tier: LeadScoreResult['tier']): string {
  switch (tier) {
    case 'hot':
      return 'bg-green-100 text-green-700';
    case 'warm':
      return 'bg-amber-100 text-amber-700';
    case 'cold':
      return 'bg-gray-100 text-gray-500';
  }
}

/**
 * Get the progress bar color for a given score.
 */
export function scoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-gray-300';
}
