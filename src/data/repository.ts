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

// ── DTOs de Creación y Edición ──────────────────────────────────────────────

export type CreateAccountDTO = Omit<Account, 'id' | 'createdAt'> & {
  id?: ID;
  createdAt?: string;
};

export type UpdateAccountDTO = Partial<Omit<Account, 'id' | 'createdAt'>>;

export type CreateTransactionDTO = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: ID;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateTransactionDTO = Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateCategoryDTO = Omit<Category, 'id'> & {
  id?: ID;
};

export type UpdateCategoryDTO = Partial<Omit<Category, 'id'>>;

export type CreateBudgetDTO = Omit<Budget, 'id'> & {
  id?: ID;
};

export type UpdateBudgetDTO = Partial<Omit<Budget, 'id'>>;

export type CreateGoalDTO = Omit<Goal, 'id'> & {
  id?: ID;
};

export type UpdateGoalDTO = Partial<Omit<Goal, 'id'>>;

// ── Interfaces Específicas por Entidad ──────────────────────────────────────

export interface AccountRepository {
  getAll(): Promise<Account[]>;
  getActive(): Promise<Account[]>;
  getById(id: ID): Promise<Account | null>;
  create(dto: CreateAccountDTO): Promise<Account>;
  update(id: ID, dto: UpdateAccountDTO): Promise<Account>;
  delete(id: ID): Promise<void>;
}

export interface TransactionRepository {
  getAll(): Promise<Transaction[]>;
  getById(id: ID): Promise<Transaction | null>;
  getByAccount(accountId: ID): Promise<Transaction[]>;
  getByDateRange(startDate: ISODate, endDate: ISODate): Promise<Transaction[]>;
  getByCategory(categoryId: ID): Promise<Transaction[]>;
  create(dto: CreateTransactionDTO): Promise<Transaction>;
  update(id: ID, dto: UpdateTransactionDTO): Promise<Transaction>;
  delete(id: ID): Promise<void>;
}

export interface CategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: ID): Promise<Category | null>;
  getByKind(kind: 'income' | 'expense'): Promise<Category[]>;
  create(dto: CreateCategoryDTO): Promise<Category>;
  update(id: ID, dto: UpdateCategoryDTO): Promise<Category>;
  delete(id: ID): Promise<void>;
}

export interface BudgetRepository {
  getAll(): Promise<Budget[]>;
  getById(id: ID): Promise<Budget | null>;
  getByMonth(month: YearMonth): Promise<Budget[]>;
  getByCategory(categoryId: ID): Promise<Budget | null>;
  create(dto: CreateBudgetDTO): Promise<Budget>;
  update(id: ID, dto: UpdateBudgetDTO): Promise<Budget>;
  delete(id: ID): Promise<void>;
}

export interface GoalRepository {
  getAll(): Promise<Goal[]>;
  getById(id: ID): Promise<Goal | null>;
  create(dto: CreateGoalDTO): Promise<Goal>;
  update(id: ID, dto: UpdateGoalDTO): Promise<Goal>;
  delete(id: ID): Promise<void>;
}

// ── Respaldo y Esquema de Backup ───────────────────────────────────────────

export interface BackupData {
  version: number;
  exportedAt: string;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
}

// ── Interfaz Global de Persistencia ─────────────────────────────────────────

export interface AppRepository {
  accounts: AccountRepository;
  transactions: TransactionRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  goals: GoalRepository;
  clearAll(): Promise<void>;
  exportJSON(): Promise<BackupData>;
  importJSON(data: BackupData, mode?: 'replace' | 'merge'): Promise<void>;
}
