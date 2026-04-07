/**
 * Asset Depreciation Engine
 *
 * Supports three methods:
 *   - straight_line: Equal depreciation each period
 *   - declining_balance: Fixed percentage of remaining book value
 *   - declining_then_straight: Declining balance switching to straight-line
 *     when straight-line produces a larger deduction
 *
 * All calculations are monthly. `useful_life_months` drives period count.
 */

export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'declining_then_straight';

export interface DepreciationInput {
  acquisitionCost: number;
  residualValue?: number;        // default 0
  usefulLifeMonths: number;
  method: DepreciationMethod;
  decliningRate?: number;        // for declining_balance — default 2 / usefulLifeYears (double-declining)
  startDate: string;             // ISO date
  existingPeriods?: number;      // already-generated periods to skip
}

export interface DepreciationEntry {
  periodNumber: number;
  entryDate: string;             // ISO date (end of month)
  depreciationAmount: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

/**
 * Generate a full depreciation schedule.
 */
export function generateDepreciationSchedule(input: DepreciationInput): DepreciationEntry[] {
  const {
    acquisitionCost,
    residualValue = 0,
    usefulLifeMonths,
    method,
    startDate,
    existingPeriods = 0,
  } = input;

  if (usefulLifeMonths <= 0 || acquisitionCost <= 0) return [];

  const depreciableCost = acquisitionCost - residualValue;
  if (depreciableCost <= 0) return [];

  const usefulLifeYears = usefulLifeMonths / 12;
  const decliningRate = input.decliningRate ?? (usefulLifeYears > 0 ? 2 / usefulLifeYears : 0);

  const entries: DepreciationEntry[] = [];
  let accumulated = 0;
  let bookValue = acquisitionCost;

  // If we have existing periods, fast-forward accumulation
  if (existingPeriods > 0) {
    const priorEntries = computeEntries({
      acquisitionCost,
      depreciableCost,
      residualValue,
      usefulLifeMonths,
      method,
      decliningRate,
      totalPeriods: existingPeriods,
    });
    const last = priorEntries[priorEntries.length - 1];
    if (last) {
      accumulated = last.accumulatedDepreciation;
      bookValue = last.bookValue;
    }
  }

  const start = new Date(startDate + 'T00:00:00Z');

  for (let p = existingPeriods + 1; p <= usefulLifeMonths; p++) {
    const amount = computePeriodAmount({
      acquisitionCost,
      depreciableCost,
      residualValue,
      usefulLifeMonths,
      method,
      decliningRate,
      period: p,
      bookValue,
      accumulated,
    });

    accumulated += amount;
    bookValue = Math.max(acquisitionCost - accumulated, residualValue);

    // Compute entry date: start + p months, end of month
    const entryDate = new Date(start);
    entryDate.setUTCMonth(entryDate.getUTCMonth() + p);
    entryDate.setUTCDate(0); // last day of previous month (which is the month we want)

    entries.push({
      periodNumber: p,
      entryDate: entryDate.toISOString().split('T')[0],
      depreciationAmount: round2(amount),
      accumulatedDepreciation: round2(accumulated),
      bookValue: round2(bookValue),
    });

    // Stop if fully depreciated
    if (bookValue <= residualValue) break;
  }

  return entries;
}

/**
 * Compute book value at a specific date.
 */
export function computeBookValue(
  acquisitionCost: number,
  residualValue: number,
  usefulLifeMonths: number,
  method: DepreciationMethod,
  startDate: string,
  asOfDate: string,
): number {
  const start = new Date(startDate);
  const asOf = new Date(asOfDate);
  const monthsElapsed = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());

  if (monthsElapsed <= 0) return acquisitionCost;

  const periods = Math.min(monthsElapsed, usefulLifeMonths);
  const schedule = generateDepreciationSchedule({
    acquisitionCost,
    residualValue,
    usefulLifeMonths,
    method,
    startDate,
    existingPeriods: 0,
  });

  const entry = schedule.find((e) => e.periodNumber === periods);
  return entry ? entry.bookValue : residualValue;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface ComputeParams {
  acquisitionCost: number;
  depreciableCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  method: DepreciationMethod;
  decliningRate: number;
  period: number;
  bookValue: number;
  accumulated: number;
}

function computePeriodAmount(params: ComputeParams): number {
  const { acquisitionCost, depreciableCost, residualValue, usefulLifeMonths, method, decliningRate, bookValue } = params;

  switch (method) {
    case 'straight_line': {
      return depreciableCost / usefulLifeMonths;
    }

    case 'declining_balance': {
      const monthlyRate = decliningRate / 12;
      const amount = bookValue * monthlyRate;
      // Don't depreciate below residual
      return Math.min(amount, bookValue - residualValue);
    }

    case 'declining_then_straight': {
      // Use declining balance, but switch to straight-line when SL produces more
      const monthlyRate = decliningRate / 12;
      const decliningAmount = bookValue * monthlyRate;
      const remainingMonths = usefulLifeMonths - params.period + 1;
      const straightAmount = remainingMonths > 0 ? (bookValue - residualValue) / remainingMonths : 0;

      const amount = Math.max(decliningAmount, straightAmount);
      return Math.min(amount, bookValue - residualValue);
    }

    default:
      return depreciableCost / usefulLifeMonths;
  }
}

function computeEntries(params: {
  acquisitionCost: number;
  depreciableCost: number;
  residualValue: number;
  usefulLifeMonths: number;
  method: DepreciationMethod;
  decliningRate: number;
  totalPeriods: number;
}): { accumulatedDepreciation: number; bookValue: number }[] {
  const entries: { accumulatedDepreciation: number; bookValue: number }[] = [];
  let accumulated = 0;
  let bookValue = params.acquisitionCost;

  for (let p = 1; p <= params.totalPeriods; p++) {
    const amount = computePeriodAmount({
      ...params,
      period: p,
      bookValue,
      accumulated,
    });
    accumulated += amount;
    bookValue = Math.max(params.acquisitionCost - accumulated, params.residualValue);
    entries.push({ accumulatedDepreciation: accumulated, bookValue });
    if (bookValue <= params.residualValue) break;
  }

  return entries;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
