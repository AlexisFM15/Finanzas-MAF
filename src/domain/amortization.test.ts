import { describe, expect, it } from 'vitest';
import type { LoanTerms } from './models';
import { amortizationSchedule, monthlyPayment } from './amortization';

describe('monthlyPayment', () => {
  it('computes exact monthly payment for standard loans using French method in cents', () => {
    // 100,000.00 EUR at 12% for 12 months -> 8,884.88 EUR (888488 cents)
    const terms: LoanTerms = {
      principal: 10000000,
      annualRate: 0.12,
      termMonths: 12,
      startDate: '2026-01-01',
    };
    expect(monthlyPayment(terms)).toBe(888488);
  });

  it('computes payment for 0% interest loans', () => {
    const terms: LoanTerms = {
      principal: 100000,
      annualRate: 0,
      termMonths: 3,
      startDate: '2026-01-01',
    };
    expect(monthlyPayment(terms)).toBe(33333);
  });

  it('computes payment for a long-term mortgage (30 years, 5%)', () => {
    const terms: LoanTerms = {
      principal: 15000000,
      annualRate: 0.05,
      termMonths: 360,
      startDate: '2026-01-01',
    };
    expect(monthlyPayment(terms)).toBe(80523);
  });

  it('throws RangeError for invalid loan parameters', () => {
    expect(() => monthlyPayment({ principal: 0, annualRate: 0.05, termMonths: 12, startDate: '2026-01-01' })).toThrow(RangeError);
    expect(() => monthlyPayment({ principal: 1000.5 as any, annualRate: 0.05, termMonths: 12, startDate: '2026-01-01' })).toThrow(RangeError);
    expect(() => monthlyPayment({ principal: 100000, annualRate: 0.05, termMonths: 0, startDate: '2026-01-01' })).toThrow(RangeError);
    expect(() => monthlyPayment({ principal: 100000, annualRate: 0.05, termMonths: 12.5, startDate: '2026-01-01' })).toThrow(RangeError);
    expect(() => monthlyPayment({ principal: 100000, annualRate: -0.01, termMonths: 12, startDate: '2026-01-01' })).toThrow(RangeError);
    expect(() => monthlyPayment({ principal: 100000, annualRate: Number.NaN, termMonths: 12, startDate: '2026-01-01' })).toThrow(RangeError);
  });
});

describe('amortizationSchedule', () => {
  it('generates a 12-month schedule ending at exactly 0 balance with integer amounts', () => {
    const terms: LoanTerms = {
      principal: 10000000,
      annualRate: 0.12,
      termMonths: 12,
      startDate: '2026-01-15',
    };

    const rows = amortizationSchedule(terms);
    expect(rows).toHaveLength(12);

    // Period 1
    expect(rows[0]).toEqual({
      period: 1,
      date: '2026-02-15',
      payment: 888488,
      interest: 100000,
      principal: 788488,
      balance: 9211512,
    });

    // Period 12 (adjusted to close balance to 0)
    expect(rows[11]).toEqual({
      period: 12,
      date: '2027-01-15',
      payment: 888485,
      interest: 8797,
      principal: 879688,
      balance: 0,
    });

    // Sum of principals must exactly equal original principal
    const sumPrincipal = rows.reduce((acc, r) => acc + r.principal, 0);
    expect(sumPrincipal).toBe(10000000);

    // Sum of interest matches exact theoretical total
    const sumInterest = rows.reduce((acc, r) => acc + r.interest, 0);
    expect(sumInterest).toBe(661853);
  });

  it('handles 0% interest loan schedule properly', () => {
    const terms: LoanTerms = {
      principal: 100000,
      annualRate: 0,
      termMonths: 3,
      startDate: '2026-01-01',
    };
    const rows = amortizationSchedule(terms);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.payment)).toEqual([33333, 33333, 33334]);
    expect(rows.every((r) => r.interest === 0)).toBe(true);
    expect(rows[2]!.balance).toBe(0);
  });

  it('handles month-end start dates correctly', () => {
    const terms: LoanTerms = {
      principal: 300000,
      annualRate: 0,
      termMonths: 3,
      startDate: '2026-01-31',
    };
    const rows = amortizationSchedule(terms);
    expect(rows.map((r) => r.date)).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ]);
  });
});
