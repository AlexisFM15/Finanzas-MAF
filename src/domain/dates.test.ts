import { describe, expect, it } from 'vitest';
import {
  addMonthsToDate,
  addMonthsToYearMonth,
  monthRange,
  toYearMonth,
} from './dates';

describe('toYearMonth', () => {
  it('extracts YYYY-MM from YYYY-MM-DD', () => {
    expect(toYearMonth('2026-03-09')).toBe('2026-03');
  });

  it('throws RangeError on invalid ISO date format', () => {
    expect(() => toYearMonth('2026/03/09' as any)).toThrow(RangeError);
  });
});

describe('addMonthsToYearMonth', () => {
  it('adds and subtracts months correctly across years', () => {
    expect(addMonthsToYearMonth('2026-11', 2)).toBe('2027-01');
    expect(addMonthsToYearMonth('2026-01', -1)).toBe('2025-12');
    expect(addMonthsToYearMonth('2026-05', 0)).toBe('2026-05');
    expect(addMonthsToYearMonth('2026-01', -13)).toBe('2024-12');
  });

  it('rejects invalid inputs', () => {
    expect(() => addMonthsToYearMonth('invalid' as any, 1)).toThrow(RangeError);
    expect(() => addMonthsToYearMonth('2026-01', Number.NaN)).toThrow(RangeError);
  });
});

describe('monthRange', () => {
  it('generates an inclusive range of year-months', () => {
    expect(monthRange('2026-11', '2027-02')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
    expect(monthRange('2026-03', '2026-03')).toEqual(['2026-03']);
  });

  it('returns empty array if from > to', () => {
    expect(monthRange('2026-04', '2026-03')).toEqual([]);
  });
});

describe('addMonthsToDate', () => {
  it('adds months preserving day when valid', () => {
    expect(addMonthsToDate('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonthsToDate('2026-12-10', 1)).toBe('2027-01-10');
  });

  it('clamps day to last day of target month (including leap year rules)', () => {
    expect(addMonthsToDate('2026-05-31', 1)).toBe('2026-06-30'); // 30-day month
    expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsToDate('2028-01-31', 1)).toBe('2028-02-29'); // 2028 is leap year
    expect(addMonthsToDate('2100-01-31', 1)).toBe('2100-02-28'); // 2100 is not leap year (century rule)
    expect(addMonthsToDate('2000-01-31', 1)).toBe('2000-02-29'); // 2000 is leap year (400 rule)
    expect(addMonthsToDate('2026-03-31', -1)).toBe('2026-02-28');

  });

  it('rejects invalid ISO dates', () => {
    expect(() => addMonthsToDate('not-a-date' as any, 1)).toThrow(RangeError);
  });
});
