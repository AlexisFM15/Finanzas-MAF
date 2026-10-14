import { describe, expect, it } from 'vitest';
import { makeTransaction } from '@/test/factories';
import { monthlySeries, monthlySummary } from './monthly';

describe('monthlySummary', () => {
  it('aggregates income and expenses for the specified month ignoring transfers', () => {
    const txs = [
      makeTransaction({ type: 'income', amount: 300000, date: '2026-03-01' }),
      makeTransaction({ type: 'expense', amount: 120000, date: '2026-03-10' }),
      makeTransaction({ type: 'expense', amount: 30000, date: '2026-03-15' }),
      makeTransaction({ type: 'transfer', amount: 50000, date: '2026-03-20', toAccountId: 'acc-2' }),
      makeTransaction({ type: 'expense', amount: 99000, date: '2026-04-01' }), // different month
    ];

    const summary = monthlySummary(txs, '2026-03');
    expect(summary).toEqual({
      month: '2026-03',
      income: 300000,
      expense: 150000,
      net: 150000,
      savingsRate: 0.5,
    });
  });

  it('handles month with no income (net is negative, savingsRate is null)', () => {
    const txs = [
      makeTransaction({ type: 'expense', amount: 1000, date: '2026-03-05' }),
    ];
    const summary = monthlySummary(txs, '2026-03');
    expect(summary).toEqual({
      month: '2026-03',
      income: 0,
      expense: 1000,
      net: -1000,
      savingsRate: null,
    });
  });

  it('calculates negative savingsRate when expenses exceed income', () => {
    const txs = [
      makeTransaction({ type: 'income', amount: 1000, date: '2026-03-01' }),
      makeTransaction({ type: 'expense', amount: 1500, date: '2026-03-05' }),
    ];
    const summary = monthlySummary(txs, '2026-03');
    expect(summary.net).toBe(-500);
    expect(summary.savingsRate).toBe(-0.5);
  });
});

describe('monthlySeries', () => {
  it('returns contiguous monthly summaries filling empty months', () => {
    const txs = [
      makeTransaction({ type: 'income', amount: 200000, date: '2026-01-10' }),
      makeTransaction({ type: 'income', amount: 300000, date: '2026-03-15' }),
    ];

    const series = monthlySeries(txs, '2026-01', '2026-03');
    expect(series).toHaveLength(3);

    expect(series[0]!.month).toBe('2026-01');
    expect(series[0]!.income).toBe(200000);

    // Empty month February
    expect(series[1]!.month).toBe('2026-02');
    expect(series[1]!.income).toBe(0);
    expect(series[1]!.expense).toBe(0);
    expect(series[1]!.net).toBe(0);
    expect(series[1]!.savingsRate).toBeNull();

    expect(series[2]!.month).toBe('2026-03');
    expect(series[2]!.income).toBe(300000);
  });
});
