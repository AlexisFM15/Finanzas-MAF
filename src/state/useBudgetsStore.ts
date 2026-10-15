import { create } from 'zustand';
import { getDefaultRepository } from '@/data';
import type {
  AppRepository,
  CreateBudgetDTO,
  CreateGoalDTO,
  UpdateBudgetDTO,
  UpdateGoalDTO,
} from '@/data/repository';
import { getDemoSeedData } from '@/data/seed';
import { balancesByAccount } from '@/domain/balances';
import {
  budgetsProgress,
  goalProgress,
  type GoalProgress,
} from '@/domain/budgets';
import type {
  Account,
  Budget,
  BudgetProgress,
  Category,
  Goal,
  ID,
  Transaction,
  YearMonth,
} from '@/domain/models';

export interface BudgetsState {
  budgets: Budget[];
  goals: Goal[];
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  selectedMonth: YearMonth;
  isLoading: boolean;
  error: string | null;
  loadData: (repo?: AppRepository) => Promise<void>;
  setSelectedMonth: (month: YearMonth) => void;
  createBudget: (dto: CreateBudgetDTO, repo?: AppRepository) => Promise<Budget>;
  updateBudget: (id: ID, dto: UpdateBudgetDTO, repo?: AppRepository) => Promise<Budget>;
  deleteBudget: (id: ID, repo?: AppRepository) => Promise<void>;
  createGoal: (dto: CreateGoalDTO, repo?: AppRepository) => Promise<Goal>;
  updateGoal: (id: ID, dto: UpdateGoalDTO, repo?: AppRepository) => Promise<Goal>;
  deleteGoal: (id: ID, repo?: AppRepository) => Promise<void>;
  getBudgetsProgress: (month?: YearMonth) => BudgetProgress[];
  getGoalsProgress: () => GoalProgress[];
}

const initialSeed = getDemoSeedData();

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: initialSeed.budgets,
  goals: initialSeed.goals,
  categories: initialSeed.categories,
  transactions: initialSeed.transactions,
  accounts: initialSeed.accounts,
  selectedMonth: '2026-04',
  isLoading: false,
  error: null,

  loadData: async (customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ isLoading: true, error: null });

    try {
      let budgets = await repo.budgets.getAll();
      let goals = await repo.goals.getAll();
      let categories = await repo.categories.getAll();
      let transactions = await repo.transactions.getAll();
      let accounts = await repo.accounts.getAll();

      if (budgets.length === 0 && accounts.length === 0) {
        const seed = getDemoSeedData();
        await repo.importJSON(seed, 'replace');
        budgets = await repo.budgets.getAll();
        goals = await repo.goals.getAll();
        categories = await repo.categories.getAll();
        transactions = await repo.transactions.getAll();
        accounts = await repo.accounts.getAll();
      }

      set({
        budgets,
        goals,
        categories,
        transactions,
        accounts,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar presupuestos y metas',
        isLoading: false,
      });
    }
  },

  setSelectedMonth: (month: YearMonth) => {
    set({ selectedMonth: month });
  },

  createBudget: async (dto: CreateBudgetDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    const created = await repo.budgets.create(dto);
    set((state) => ({ budgets: [...state.budgets, created] }));
    return created;
  },

  updateBudget: async (id: ID, dto: UpdateBudgetDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    const updated = await repo.budgets.update(id, dto);
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? updated : b)),
    }));
    return updated;
  },

  deleteBudget: async (id: ID, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    await repo.budgets.delete(id);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  createGoal: async (dto: CreateGoalDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    const created = await repo.goals.create(dto);
    set((state) => ({ goals: [...state.goals, created] }));
    return created;
  },

  updateGoal: async (id: ID, dto: UpdateGoalDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    const updated = await repo.goals.update(id, dto);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updated : g)),
    }));
    return updated;
  },

  deleteGoal: async (id: ID, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    await repo.goals.delete(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  getBudgetsProgress: (month?: YearMonth) => {
    const activeMonth = month ?? get().selectedMonth;
    return budgetsProgress(get().budgets, get().transactions, activeMonth);
  },

  getGoalsProgress: () => {
    const balances = balancesByAccount(get().accounts, get().transactions);
    return get().goals.map((goal) => goalProgress(goal, balances));
  },
}));
