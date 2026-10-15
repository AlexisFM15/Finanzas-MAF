import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetsStore } from './useBudgetsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';

describe('useBudgetsStore', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
  });

  it('loads budgets, goals, categories and computes progress for active month', async () => {
    await useBudgetsStore.getState().loadData(repo);

    const state = useBudgetsStore.getState();
    expect(state.budgets.length).toBeGreaterThanOrEqual(1);
    expect(state.goals.length).toBeGreaterThanOrEqual(1);

    const progress = state.getBudgetsProgress('2026-04');
    expect(progress.length).toBeGreaterThanOrEqual(1);
    expect(progress[0]?.status).toBeDefined();
  });

  it('creates and updates a budget and recalculates progress', async () => {
    await useBudgetsStore.getState().loadData(repo);

    const created = await useBudgetsStore.getState().createBudget(
      {
        categoryId: 'cat-services',
        monthlyLimit: 150000, // $1,500.00 DOP
        alertThreshold: 0.8,
        startMonth: '2026-04',
      },
      repo,
    );

    expect(created.id).toBeDefined();
    expect(useBudgetsStore.getState().budgets.some((b) => b.id === created.id)).toBe(true);

    const updated = await useBudgetsStore.getState().updateBudget(
      created.id,
      { monthlyLimit: 200000 },
      repo,
    );
    expect(updated.monthlyLimit).toBe(200000);

    await useBudgetsStore.getState().deleteBudget(created.id, repo);
    expect(useBudgetsStore.getState().budgets.some((b) => b.id === created.id)).toBe(false);
  });

  it('creates and updates a goal and computes goal progress', async () => {
    await useBudgetsStore.getState().loadData(repo);

    const createdGoal = await useBudgetsStore.getState().createGoal(
      {
        name: 'Viaje a Roma',
        targetAmount: 8000000, // $80,000.00 DOP
        manualAmount: 1500000,
      },
      repo,
    );

    expect(createdGoal.id).toBeDefined();
    expect(useBudgetsStore.getState().goals.some((g) => g.id === createdGoal.id)).toBe(true);

    const goalsProgress = useBudgetsStore.getState().getGoalsProgress();
    const myProgress = goalsProgress.find((p) => p.goal.id === createdGoal.id);
    expect(myProgress).toBeDefined();
    expect(myProgress?.current).toBe(1500000);
    expect(myProgress?.remaining).toBe(6500000);
    expect(myProgress?.reached).toBe(false);

    await useBudgetsStore.getState().deleteGoal(createdGoal.id, repo);
    expect(useBudgetsStore.getState().goals.some((g) => g.id === createdGoal.id)).toBe(false);
  });
});
