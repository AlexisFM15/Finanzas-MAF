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
import { FinancialDB } from './db';

export class DexieRepository implements AppRepository {
  readonly db: FinancialDB;

  constructor(dbOrName?: FinancialDB | string) {
    if (dbOrName instanceof FinancialDB) {
      this.db = dbOrName;
    } else {
      this.db = new FinancialDB(dbOrName);
    }
  }

  // ── Accounts ───────────────────────────────────────────────────────────────
  accounts: AccountRepository = {
    getAll: async (): Promise<Account[]> => {
      return this.db.accounts.toArray();
    },

    getActive: async (): Promise<Account[]> => {
      return this.db.accounts.filter((acc) => !acc.archived).toArray();
    },

    getById: async (id: ID): Promise<Account | null> => {
      const item = await this.db.accounts.get(id);
      return item ?? null;
    },

    create: async (dto: CreateAccountDTO): Promise<Account> => {
      const id = dto.id ?? crypto.randomUUID();
      const account: Account = {
        ...dto,
        id,
        createdAt: dto.createdAt ?? new Date().toISOString(),
      };
      await this.db.accounts.add(account);
      return account;
    },

    update: async (id: ID, dto: UpdateAccountDTO): Promise<Account> => {
      const existing = await this.db.accounts.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: cuenta con ID ${id}`);
      }
      const updated: Account = {
        ...existing,
        ...dto,
      };
      await this.db.accounts.put(updated);
      return updated;
    },

    delete: async (id: ID): Promise<void> => {
      const existing = await this.db.accounts.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: cuenta con ID ${id}`);
      }
      await this.db.accounts.delete(id);
    },
  };

  // ── Transactions ───────────────────────────────────────────────────────────
  transactions: TransactionRepository = {
    getAll: async (): Promise<Transaction[]> => {
      const items = await this.db.transactions.toArray();
      return items.sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    },

    getById: async (id: ID): Promise<Transaction | null> => {
      const item = await this.db.transactions.get(id);
      return item ?? null;
    },

    getByAccount: async (accountId: ID): Promise<Transaction[]> => {
      const items = await this.db.transactions
        .filter((tx) => tx.accountId === accountId || tx.toAccountId === accountId)
        .toArray();
      return items.sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    },

    getByDateRange: async (startDate: ISODate, endDate: ISODate): Promise<Transaction[]> => {
      const items = await this.db.transactions
        .filter((tx) => tx.date >= startDate && tx.date <= endDate)
        .toArray();
      return items.sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    },

    getByCategory: async (categoryId: ID): Promise<Transaction[]> => {
      const items = await this.db.transactions
        .filter((tx) => tx.categoryId === categoryId)
        .toArray();
      return items.sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
    },

    create: async (dto: CreateTransactionDTO): Promise<Transaction> => {
      const id = dto.id ?? crypto.randomUUID();
      const now = new Date().toISOString();
      const transaction: Transaction = {
        ...dto,
        id,
        createdAt: dto.createdAt ?? now,
        updatedAt: dto.updatedAt ?? now,
      };
      await this.db.transactions.add(transaction);
      return transaction;
    },

    update: async (id: ID, dto: UpdateTransactionDTO): Promise<Transaction> => {
      const existing = await this.db.transactions.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: transacción con ID ${id}`);
      }
      const updated: Transaction = {
        ...existing,
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      await this.db.transactions.put(updated);
      return updated;
    },

    delete: async (id: ID): Promise<void> => {
      const existing = await this.db.transactions.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: transacción con ID ${id}`);
      }
      await this.db.transactions.delete(id);
    },
  };

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: CategoryRepository = {
    getAll: async (): Promise<Category[]> => {
      return this.db.categories.toArray();
    },

    getById: async (id: ID): Promise<Category | null> => {
      const item = await this.db.categories.get(id);
      return item ?? null;
    },

    getByKind: async (kind: 'income' | 'expense'): Promise<Category[]> => {
      return this.db.categories.filter((cat) => cat.kind === kind).toArray();
    },

    create: async (dto: CreateCategoryDTO): Promise<Category> => {
      const id = dto.id ?? crypto.randomUUID();
      const category: Category = {
        ...dto,
        id,
      };
      await this.db.categories.add(category);
      return category;
    },

    update: async (id: ID, dto: UpdateCategoryDTO): Promise<Category> => {
      const existing = await this.db.categories.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: categoría con ID ${id}`);
      }
      const updated: Category = {
        ...existing,
        ...dto,
      };
      await this.db.categories.put(updated);
      return updated;
    },

    delete: async (id: ID): Promise<void> => {
      const existing = await this.db.categories.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: categoría con ID ${id}`);
      }
      await this.db.categories.delete(id);
    },
  };

  // ── Budgets ────────────────────────────────────────────────────────────────
  budgets: BudgetRepository = {
    getAll: async (): Promise<Budget[]> => {
      return this.db.budgets.toArray();
    },

    getById: async (id: ID): Promise<Budget | null> => {
      const item = await this.db.budgets.get(id);
      return item ?? null;
    },

    getByMonth: async (month: YearMonth): Promise<Budget[]> => {
      return this.db.budgets.filter((b) => b.startMonth === month).toArray();
    },

    getByCategory: async (categoryId: ID): Promise<Budget | null> => {
      const match = await this.db.budgets.filter((b) => b.categoryId === categoryId).first();
      return match ?? null;
    },

    create: async (dto: CreateBudgetDTO): Promise<Budget> => {
      const id = dto.id ?? crypto.randomUUID();
      const budget: Budget = {
        ...dto,
        id,
      };
      await this.db.budgets.add(budget);
      return budget;
    },

    update: async (id: ID, dto: UpdateBudgetDTO): Promise<Budget> => {
      const existing = await this.db.budgets.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: presupuesto con ID ${id}`);
      }
      const updated: Budget = {
        ...existing,
        ...dto,
      };
      await this.db.budgets.put(updated);
      return updated;
    },

    delete: async (id: ID): Promise<void> => {
      const existing = await this.db.budgets.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: presupuesto con ID ${id}`);
      }
      await this.db.budgets.delete(id);
    },
  };

  // ── Goals ──────────────────────────────────────────────────────────────────
  goals: GoalRepository = {
    getAll: async (): Promise<Goal[]> => {
      return this.db.goals.toArray();
    },

    getById: async (id: ID): Promise<Goal | null> => {
      const item = await this.db.goals.get(id);
      return item ?? null;
    },

    create: async (dto: CreateGoalDTO): Promise<Goal> => {
      const id = dto.id ?? crypto.randomUUID();
      const goal: Goal = {
        ...dto,
        id,
      };
      await this.db.goals.add(goal);
      return goal;
    },

    update: async (id: ID, dto: UpdateGoalDTO): Promise<Goal> => {
      const existing = await this.db.goals.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: meta con ID ${id}`);
      }
      const updated: Goal = {
        ...existing,
        ...dto,
      };
      await this.db.goals.put(updated);
      return updated;
    },

    delete: async (id: ID): Promise<void> => {
      const existing = await this.db.goals.get(id);
      if (!existing) {
        throw new Error(`Entidad no encontrada: meta con ID ${id}`);
      }
      await this.db.goals.delete(id);
    },
  };

  // ── Database Operations ────────────────────────────────────────────────────
  async clearAll(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.accounts,
        this.db.transactions,
        this.db.categories,
        this.db.budgets,
        this.db.goals,
      ],
      async () => {
        await Promise.all([
          this.db.accounts.clear(),
          this.db.transactions.clear(),
          this.db.categories.clear(),
          this.db.budgets.clear(),
          this.db.goals.clear(),
        ]);
      }
    );
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

    await this.db.transaction(
      'rw',
      [
        this.db.accounts,
        this.db.transactions,
        this.db.categories,
        this.db.budgets,
        this.db.goals,
      ],
      async () => {
        if (mode === 'replace') {
          await Promise.all([
            this.db.accounts.clear(),
            this.db.transactions.clear(),
            this.db.categories.clear(),
            this.db.budgets.clear(),
            this.db.goals.clear(),
          ]);
        }

        await Promise.all([
          this.db.accounts.bulkPut(data.accounts),
          this.db.transactions.bulkPut(data.transactions),
          this.db.categories.bulkPut(data.categories),
          this.db.budgets.bulkPut(data.budgets),
          this.db.goals.bulkPut(data.goals),
        ]);
      }
    );
  }
}

export function createDexieRepository(dbName?: string): DexieRepository {
  return new DexieRepository(dbName);
}
