/**
 * Role-based cost and billable rate utilities.
 *
 * Manages cost rates per role for accurate margin/profitability calculations.
 *
 * @module lib/cost-rates
 */


/**
 * Default cost rates for common production roles.
 * Used when an org hasn't configured custom rates.
 */
export const DEFAULT_COST_RATES: Record<string, { cost: number; billable: number }> = {
  project_manager: { cost: 55, billable: 125 },
  designer: { cost: 45, billable: 110 },
  fabricator: { cost: 35, billable: 85 },
  installer: { cost: 30, billable: 75 },
  av_tech: { cost: 40, billable: 95 },
  rigger: { cost: 45, billable: 100 },
  brand_ambassador: { cost: 20, billable: 45 },
  coordinator: { cost: 35, billable: 80 },
  art_director: { cost: 60, billable: 150 },
  technical_director: { cost: 65, billable: 160 },
};

/**
 * Format a cost rate for display.
 */
export function formatRate(rate: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate);
}
