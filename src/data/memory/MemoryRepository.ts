import type {
  Account,
  Budget,
  Category,
  Goal,
  ID,
  ISODate,
  Transaction,
  YearMonth,
} from '@/domain/models';
import type {
  AccountRepository,
  AppRepository,
  BackupData,
  BudgetRepository,
  CategoryRepository,
  CreateAccountDTO,
  CreateBudgetDTO,
  CreateCategoryDTO,
  CreateGoalDTO,
  CreateTransactionDTO,
  GoalRepository,
  TransactionRepository,
  UpdateAccountDTO,
  UpdateBudgetDTO,
  UpdateCategoryDTO,
  UpdateGoalDTO,
  UpdateTransactionDTO,
} from '../repository';

import { validateBackupData } from '../backupValidation';

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export class MemoryRepository implements AppRepository {
  private accountsMap = new Map<ID, Account>();
  private transactionsMap = new Map<ID, Transaction>();
  private categoriesMap = new Map<ID, Category>();
  private budgetsMap = new Map<ID, Budget>();
  private goalsMap = new Map<ID, Goal>();

  // ── Accounts ───────────────────────────────────────────────────────────────
  accounts: AccountRepository = {
    getAll: async (): Promise<Account[]> => {
      return Array.from(this.accountsMap.values()).map(clone);
    },

    getActive: async (): Promise<Account[]> => {
      return Array.from(this.accountsMap.values())
        .filter((acc) => !acc.archived)
        .map(clone);
    },

    getById: async (id: ID): Promise<Account | null> => {
      const item = this.accountsMap.get(id);
      return item ? clone(item) : null;
    },

    create: async (dto: CreateAccountDTO): Promise<Account> => {
      const id = dto.id ?? crypto.randomUUID();
      const account: Account = {
        ...clone(dto),
        id,
        createdAt: dto.createdAt ?? new Date().toISOString(),
      };
      this.accountsMap.set(id, clone(account));
      return clone(account);
    },

    update: async (id: ID, dto: UpdateAccountDTO): Promise<Account> => {
      const existing = this.accountsMap.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: cuenta con ID ${id}`);
      }
      const updated: Account = {
        ...existing,
        ...clone(dto),
      };
      this.accountsMap.set(id, clone(updated));
      return clone(updated);
    },

    delete: async (id: ID): Promise<void> => {
      if (!this.accountsMap.has(id)) {
        throw new Error(`Entidad no encontrada: cuenta con ID ${id}`);
      }
      this.accountsMap.delete(id);
    },
  };

  // ── Transactions ───────────────────────────────────────────────────────────
  transactions: TransactionRepository = {
    getAll: async (): Promise<Transaction[]> => {
      return Array.from(this.transactionsMap.values())
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .map(clone);
    },

    getById: async (id: ID): Promise<Transaction | null> => {
      const item = this.transactionsMap.get(id);
      return item ? clone(item) : null;
    },

    getByAccount: async (accountId: ID): Promise<Transaction[]> => {
      return Array.from(this.transactionsMap.values())
        .filter((tx) => tx.accountId === accountId || tx.toAccountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .map(clone);
    },

    getByDateRange: async (startDate: ISODate, endDate: ISODate): Promise<Transaction[]> => {
      return Array.from(this.transactionsMap.values())
        .filter((tx) => tx.date >= startDate && tx.date <= endDate)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .map(clone);
    },

    getByCategory: async (categoryId: ID): Promise<Transaction[]> => {
      return Array.from(this.transactionsMap.values())
        .filter((tx) => tx.categoryId === categoryId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .map(clone);
    },

    create: async (dto: CreateTransactionDTO): Promise<Transaction> => {
      const id = dto.id ?? crypto.randomUUID();
      const now = new Date().toISOString();
      const transaction: Transaction = {
        ...clone(dto),
        id,
        createdAt: dto.createdAt ?? now,
        updatedAt: dto.updatedAt ?? now,
      };
      this.transactionsMap.set(id, clone(transaction));
      return clone(transaction);
    },

    update: async (id: ID, dto: UpdateTransactionDTO): Promise<Transaction> => {
      const existing = this.transactionsMap.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: transacción con ID ${id}`);
      }
      const updated: Transaction = {
        ...existing,
        ...clone(dto),
        updatedAt: new Date().toISOString(),
      };
      this.transactionsMap.set(id, clone(updated));
      return clone(updated);
    },

    delete: async (id: ID): Promise<void> => {
      if (!this.transactionsMap.has(id)) {
        throw new Error(`Entidad no encontrada: transacción con ID ${id}`);
      }
      this.transactionsMap.delete(id);
    },
  };

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: CategoryRepository = {
    getAll: async (): Promise<Category[]> => {
      return Array.from(this.categoriesMap.values()).map(clone);
    },

    getById: async (id: ID): Promise<Category | null> => {
      const item = this.categoriesMap.get(id);
      return item ? clone(item) : null;
    },

    getByKind: async (kind: 'income' | 'expense'): Promise<Category[]> => {
      return Array.from(this.categoriesMap.values())
        .filter((cat) => cat.kind === kind)
        .map(clone);
    },

    create: async (dto: CreateCategoryDTO): Promise<Category> => {
      const id = dto.id ?? crypto.randomUUID();
      const category: Category = {
        ...clone(dto),
        id,
      };
      this.categoriesMap.set(id, clone(category));
      return clone(category);
    },

    update: async (id: ID, dto: UpdateCategoryDTO): Promise<Category> => {
      const existing = this.categoriesMap.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: categoría con ID ${id}`);
      }
      const updated: Category = {
        ...existing,
        ...clone(dto),
      };
      this.categoriesMap.set(id, clone(updated));
      return clone(updated);
    },

    delete: async (id: ID): Promise<void> => {
      if (!this.categoriesMap.has(id)) {
        throw new Error(`Entidad no encontrada: categoría con ID ${id}`);
      }
      this.categoriesMap.delete(id);
    },
  };

  // ── Budgets ────────────────────────────────────────────────────────────────
  budgets: BudgetRepository = {
    getAll: async (): Promise<Budget[]> => {
      return Array.from(this.budgetsMap.values()).map(clone);
    },

    getById: async (id: ID): Promise<Budget | null> => {
      const item = this.budgetsMap.get(id);
      return item ? clone(item) : null;
    },

    getByMonth: async (month: YearMonth): Promise<Budget[]> => {
      return Array.from(this.budgetsMap.values())
        .filter((b) => b.startMonth === month)
        .map(clone);
    },

    getByCategory: async (categoryId: ID): Promise<Budget | null> => {
      const match = Array.from(this.budgetsMap.values()).find(
        (b) => b.categoryId === categoryId
      );
      return match ? clone(match) : null;
    },

    create: async (dto: CreateBudgetDTO): Promise<Budget> => {
      const id = dto.id ?? crypto.randomUUID();
      const budget: Budget = {
        ...clone(dto),
        id,
      };
      this.budgetsMap.set(id, clone(budget));
      return clone(budget);
    },

    update: async (id: ID, dto: UpdateBudgetDTO): Promise<Budget> => {
      const existing = this.budgetsMap.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: presupuesto con ID ${id}`);
      }
      const updated: Budget = {
        ...existing,
        ...clone(dto),
      };
      this.budgetsMap.set(id, clone(updated));
      return clone(updated);
    },

    delete: async (id: ID): Promise<void> => {
      if (!this.budgetsMap.has(id)) {
        throw new Error(`Entidad no encontrada: presupuesto con ID ${id}`);
      }
      this.budgetsMap.delete(id);
    },
  };

  // ── Goals ──────────────────────────────────────────────────────────────────
  goals: GoalRepository = {
    getAll: async (): Promise<Goal[]> => {
      return Array.from(this.goalsMap.values()).map(clone);
    },

    getById: async (id: ID): Promise<Goal | null> => {
      const item = this.goalsMap.get(id);
      return item ? clone(item) : null;
    },

    create: async (dto: CreateGoalDTO): Promise<Goal> => {
      const id = dto.id ?? crypto.randomUUID();
      const goal: Goal = {
        ...clone(dto),
        id,
      };
      this.goalsMap.set(id, clone(goal));
      return clone(goal);
    },

    update: async (id: ID, dto: UpdateGoalDTO): Promise<Goal> => {
      const existing = this.goalsMap.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: meta con ID ${id}`);
      }
      const updated: Goal = {
        ...existing,
        ...clone(dto),
      };
      this.goalsMap.set(id, clone(updated));
      return clone(updated);
    },

    delete: async (id: ID): Promise<void> => {
      if (!this.goalsMap.has(id)) {
        throw new Error(`Entidad no encontrada: meta con ID ${id}`);
      }
      this.goalsMap.delete(id);
    },
  };

  // ── Database Operations ────────────────────────────────────────────────────
  async clearAll(): Promise<void> {
    this.accountsMap.clear();
    this.transactionsMap.clear();
    this.categoriesMap.clear();
    this.budgetsMap.clear();
    this.goalsMap.clear();
  }

  async exportJSON(): Promise<BackupData> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: await this.accounts.getAll(),
      transactions: await this.transactions.getAll(),
      categories: await this.categories.getAll(),
      budgets: await this.budgets.getAll(),
      goals: await this.goals.getAll(),
    };
  }

  async importJSON(data: BackupData, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
    validateBackupData(data);

    if (mode === 'replace') {
      await this.clearAll();
    }

    for (const acc of data.accounts) {
      this.accountsMap.set(acc.id, clone(acc));
    }
    for (const tx of data.transactions) {
      this.transactionsMap.set(tx.id, clone(tx));
    }
    for (const cat of data.categories) {
      this.categoriesMap.set(cat.id, clone(cat));
    }
    for (const b of data.budgets) {
      this.budgetsMap.set(b.id, clone(b));
    }
    for (const g of data.goals) {
      this.goalsMap.set(g.id, clone(g));
    }
  }
}
