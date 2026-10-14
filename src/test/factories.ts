import type { Account, Budget, Category, Goal, Transaction } from '@/domain/models';

/** Builders de test: defaults razonables + overrides. Ids incrementales por tipo. */
const counters = new Map<string, number>();
function nextId(prefix: string): string {
  const n = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, n);
  return `${prefix}-${n}`;
}

const TIMESTAMP = '2026-01-01T00:00:00.000Z';

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: nextId('acc'),
    name: 'Cuenta corriente',
    type: 'checking',
    currency: 'EUR',
    openingBalance: 0,
    color: '#10b981',
    archived: false,
    createdAt: TIMESTAMP,
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: nextId('tx'),
    type: 'expense',
    accountId: 'acc-1',
    amount: 1000,
    date: '2026-01-15',
    description: 'Movimiento',
    categoryId: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: nextId('cat'),
    name: 'Categoría',
    kind: 'expense',
    icon: 'tag',
    color: '#71717a',
    keywords: [],
    ...overrides,
  };
}

export function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: nextId('bud'),
    categoryId: 'cat-1',
    monthlyLimit: 10000,
    alertThreshold: 0.8,
    startMonth: '2026-01',
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: nextId('goal'),
    name: 'Meta',
    targetAmount: 100000,
    ...overrides,
  };
}
