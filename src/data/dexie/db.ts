import Dexie, { type EntityTable } from 'dexie';
import type { Account, Budget, Category, Goal, Transaction } from '@/domain/models';

export class FinancialDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  goals!: EntityTable<Goal, 'id'>;

  constructor(dbName = 'financial_pwa_db') {
    super(dbName);
    this.version(1).stores({
      accounts: 'id, type, currency, archived, createdAt',
      transactions: 'id, type, accountId, toAccountId, date, categoryId, createdAt',
      categories: 'id, kind, name',
      budgets: 'id, categoryId, startMonth',
      goals: 'id, targetAmount, deadline',
    });
  }
}
