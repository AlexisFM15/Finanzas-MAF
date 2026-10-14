import { describe, expect, it } from 'vitest';
import { makeBudget, makeGoal, makeTransaction } from '@/test/factories';
import {
  budgetProgress,
  budgetsProgress,
  budgetStatus,
  goalProgress,
  isBudgetActive,
} from './budgets';

describe('budgetStatus', () => {
  it('returns safe, warning or over based on spent vs limit and threshold', () => {
    // limit 10000, threshold 0.8 -> warning at >= 8000, over at > 10000
    expect(budgetStatus(0, 10000, 0.8)).toBe('safe');
    expect(budgetStatus(7999, 10000, 0.8)).toBe('safe');
    expect(budgetStatus(8000, 10000, 0.8)).toBe('warning');
    expect(budgetStatus(10000, 10000, 0.8)).toBe('warning'); // exactly at limit is warning, not over
    expect(budgetStatus(10001, 10000, 0.8)).toBe('over');
  });

  it('handles limit 0 correctly', () => {
    expect(budgetStatus(0, 0, 0.8)).toBe('safe');
    expect(budgetStatus(1, 0, 0.8)).toBe('over');
  });
});

describe('isBudgetActive', () => {
  it('checks if month is on or after budget startMonth', () => {
    const budget = makeBudget({ startMonth: '2026-03' });
    expect(isBudgetActive(budget, '2026-02')).toBe(false);
    expect(isBudgetActive(budget, '2026-03')).toBe(true);
    expect(isBudgetActive(budget, '2027-01')).toBe(true);
  });
});

describe('budgetProgress', () => {
  it('calculates progress for a budget in a given month', () => {
    const budget = makeBudget({
      categoryId: 'cat-groceries',
      monthlyLimit: 50000,
      alertThreshold: 0.8,
    });

    const txs = [
      makeTransaction({ categoryId: 'cat-groceries', type: 'expense', amount: 30000, date: '2026-03-02' }),
      makeTransaction({ categoryId: 'cat-groceries', type: 'expense', amount: 15000, date: '2026-03-12' }),
      makeTransaction({ categoryId: 'cat-other', type: 'expense', amount: 99000, date: '2026-03-15' }), // diff cat
      makeTransaction({ categoryId: 'cat-groceries', type: 'expense', amount: 20000, date: '2026-02-15' }), // diff month
      makeTransaction({ categoryId: 'cat-groceries', type: 'income', amount: 10000, date: '2026-03-20' }), // income ignored
    ];

    const progress = budgetProgress(budget, txs, '2026-03');
    expect(progress).toEqual({
      budget,
      month: '2026-03',
      spent: 45000,
      remaining: 5000,
      ratio: 0.9,
      status: 'warning',
    });
  });

  it('calculates over-budget progress with negative remaining', () => {
    const budget = makeBudget({ monthlyLimit: 20000, categoryId: 'cat-1' });
    const txs = [
      makeTransaction({ categoryId: 'cat-1', type: 'expense', amount: 25000, date: '2026-03-10' }),
    ];
    const progress = budgetProgress(budget, txs, '2026-03');
    expect(progress.spent).toBe(25000);
    expect(progress.remaining).toBe(-5000);
    expect(progress.status).toBe('over');
  });

  it('handles limit 0 with spent 0 without NaN ratio', () => {
    const budget = makeBudget({ monthlyLimit: 0, categoryId: 'cat-1' });
    const progress = budgetProgress(budget, [], '2026-03');
    expect(progress.ratio).toBe(0);
    expect(progress.status).toBe('safe');

    const txs = [makeTransaction({ categoryId: 'cat-1', type: 'expense', amount: 500, date: '2026-03-01' })];
    const overProgress = budgetProgress(budget, txs, '2026-03');
    expect(overProgress.ratio).toBe(1);
    expect(overProgress.status).toBe('over');
  });

});

describe('budgetsProgress', () => {
  it('filters out inactive budgets', () => {
    const b1 = makeBudget({ id: 'b1', startMonth: '2026-01' });
    const b2 = makeBudget({ id: 'b2', startMonth: '2026-04' });

    const list = budgetsProgress([b1, b2], [], '2026-03');
    expect(list).toHaveLength(1);
    expect(list[0]!.budget.id).toBe('b1');
  });
});

describe('goalProgress', () => {
  it('computes goal progress linked to an account balance', () => {
    const goal = makeGoal({
      id: 'g1',
      targetAmount: 100000,
      linkedAccountId: 'acc-savings',
    });
    const balances = new Map([['acc-savings', 25000]]);

    const progress = goalProgress(goal, balances);
    expect(progress).toEqual({
      goal,
      current: 25000,
      remaining: 75000,
      ratio: 0.25,
      reached: false,
    });
  });

  it('computes reached goal with manual amount', () => {
    const goal = makeGoal({
      id: 'g2',
      targetAmount: 50000,
      manualAmount: 60000,
    });
    const progress = goalProgress(goal, new Map());
    expect(progress.current).toBe(60000);
    expect(progress.remaining).toBe(0);
    expect(progress.ratio).toBe(1);
    expect(progress.reached).toBe(true);
  });

  it('defaults to 0 for unlinked goals without manual amount or with negative balance', () => {
    const goalUnlinked = makeGoal({ targetAmount: 50000 });
    expect(goalProgress(goalUnlinked, new Map()).current).toBe(0);

    const goalNegative = makeGoal({ targetAmount: 50000, linkedAccountId: 'acc-debt' });
    const balances = new Map([['acc-debt', -5000]]);
    const progress = goalProgress(goalNegative, balances);
    expect(progress.current).toBe(0);
    expect(progress.ratio).toBe(0);

    const goalMissing = makeGoal({ targetAmount: 50000, linkedAccountId: 'acc-missing' });
    expect(goalProgress(goalMissing, new Map()).current).toBe(0);
  });


  it('handles targetAmount 0 as immediately reached', () => {
    const goal = makeGoal({ targetAmount: 0 });
    const progress = goalProgress(goal, new Map());
    expect(progress.reached).toBe(true);
    expect(progress.ratio).toBe(1);
  });
});
