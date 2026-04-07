/**
 * Depreciation Engine — Unit Tests
 *
 * Validates all 3 depreciation methods:
 *   - Straight Line
 *   - Declining Balance
 *   - Declining then Straight (hybrid)
 */
import { describe, it, expect } from 'vitest';
import {
  generateDepreciationSchedule,
  computeBookValue,
  type DepreciationInput,
  type DepreciationEntry,
} from '@/lib/assets/depreciation';

const BASE: Omit<DepreciationInput, 'method'> = {
  acquisitionCost: 120000,
  residualValue: 0,
  usefulLifeMonths: 60,
  startDate: '2026-01-01',
};

function genSL(overrides: Partial<DepreciationInput> = {}): DepreciationEntry[] {
  return generateDepreciationSchedule({ ...BASE, method: 'straight_line', ...overrides });
}

function genDB(overrides: Partial<DepreciationInput> = {}): DepreciationEntry[] {
  return generateDepreciationSchedule({ ...BASE, method: 'declining_balance', ...overrides });
}

function genHybrid(overrides: Partial<DepreciationInput> = {}): DepreciationEntry[] {
  return generateDepreciationSchedule({ ...BASE, method: 'declining_then_straight', ...overrides });
}

describe('Depreciation Engine', () => {
  // ─── Straight Line ────────────────────────────────────────────────
  describe('Straight Line', () => {
    it('produces correct number of periods', () => {
      expect(genSL()).toHaveLength(60);
    });

    it('depreciates evenly per period', () => {
      const result = genSL();
      const expected = 120000 / 60; // $2,000/month
      expect(result[0].depreciationAmount).toBeCloseTo(expected, 2);
      expect(result[30].depreciationAmount).toBeCloseTo(expected, 2);
    });

    it('reaches residual value at end', () => {
      const last = genSL().at(-1)!;
      expect(last.bookValue).toBeCloseTo(0, 2);
    });

    it('handles non-zero residual value', () => {
      const last = genSL({ residualValue: 20000 }).at(-1)!;
      expect(last.bookValue).toBeCloseTo(20000, 2);
    });

    it('period numbers are sequential', () => {
      genSL().forEach((entry, i) => {
        expect(entry.periodNumber).toBe(i + 1);
      });
    });

    it('accumulated depreciation sums correctly', () => {
      const last = genSL().at(-1)!;
      expect(last.accumulatedDepreciation).toBeCloseTo(120000, 2);
    });

    it('entry dates are valid ISO dates', () => {
      genSL().forEach((entry) => {
        const d = new Date(entry.entryDate);
        expect(d.getTime()).not.toBeNaN();
      });
    });
  });

  // ─── Declining Balance ────────────────────────────────────────────
  describe('Declining Balance', () => {
    it('produces correct number of periods', () => {
      expect(genDB()).toHaveLength(60);
    });

    it('front-loads depreciation (period 1 > period 30)', () => {
      const result = genDB();
      expect(result[0].depreciationAmount).toBeGreaterThan(result[29].depreciationAmount);
    });

    it('book value decreases monotonically', () => {
      const result = genDB();
      for (let i = 1; i < result.length; i++) {
        expect(result[i].bookValue).toBeLessThanOrEqual(result[i - 1].bookValue);
      }
    });

    it('never goes below residual value', () => {
      const result = genDB({ residualValue: 10000 });
      result.forEach((entry) => {
        expect(entry.bookValue).toBeGreaterThanOrEqual(10000 - 0.01); // floating point tolerance
      });
    });
  });

  // ─── Hybrid (Declining then Straight) ─────────────────────────────
  describe('Hybrid (Declining then Straight)', () => {
    it('produces correct number of periods', () => {
      expect(genHybrid()).toHaveLength(60);
    });

    it('starts with declining balance approach', () => {
      const sl = genSL();
      const hybrid = genHybrid();
      // First period of hybrid should match or exceed straight line
      expect(hybrid[0].depreciationAmount).toBeGreaterThanOrEqual(sl[0].depreciationAmount);
    });

    it('reaches near-zero at end of useful life', () => {
      const last = genHybrid().at(-1)!;
      expect(last.bookValue).toBeCloseTo(0, 0);
    });

    it('accumulated depreciation equals cost minus residual', () => {
      const last = genHybrid({ residualValue: 5000 }).at(-1)!;
      expect(last.accumulatedDepreciation).toBeCloseTo(115000, 0);
    });
  });

  // ─── Book Value at Date ───────────────────────────────────────────
  describe('computeBookValue', () => {
    it('returns acquisition cost before start', () => {
      const bv = computeBookValue(120000, 0, 60, 'straight_line', '2026-01-01', '2025-06-01');
      expect(bv).toBe(120000);
    });

    it('returns correct value mid-life', () => {
      const bv = computeBookValue(120000, 0, 60, 'straight_line', '2026-01-01', '2028-01-01');
      // 24 months elapsed → 24 * 2000 = 48000 depreciated → 72000 remaining
      expect(bv).toBeCloseTo(72000, 0);
    });

    it('returns residual value after full depreciation', () => {
      const bv = computeBookValue(120000, 10000, 60, 'straight_line', '2026-01-01', '2032-01-01');
      expect(bv).toBeCloseTo(10000, 0);
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────
  describe('Edge Cases', () => {
    it('handles 1-month useful life', () => {
      const result = genSL({ usefulLifeMonths: 1 });
      expect(result).toHaveLength(1);
      expect(result[0].bookValue).toBeCloseTo(0, 2);
    });

    it('returns empty for zero acquisition cost', () => {
      const result = genSL({ acquisitionCost: 0 });
      expect(result).toHaveLength(0);
    });

    it('returns empty when residual >= acquisition (no depreciable cost)', () => {
      const result = genSL({ residualValue: 150000 });
      expect(result).toHaveLength(0);
    });

    it('supports existing periods for continuation', () => {
      const full = genSL();
      const continued = generateDepreciationSchedule({
        ...BASE,
        method: 'straight_line',
        existingPeriods: 30,
      });
      // Should only have remaining 30 periods
      expect(continued).toHaveLength(30);
      expect(continued[0].periodNumber).toBe(31);
      // Last entry should match the full schedule's last entry
      expect(continued.at(-1)!.bookValue).toBeCloseTo(full.at(-1)!.bookValue, 2);
    });
  });
});
