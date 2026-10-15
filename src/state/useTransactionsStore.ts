import { create } from 'zustand';
import { getDefaultRepository } from '@/data';
import type { AppRepository, CreateTransactionDTO, UpdateTransactionDTO } from '@/data/repository';
import { getDemoSeedData } from '@/data/seed';
import {
  filterTransactions,
  sortTransactions,
  type TransactionFilter,
  type TransactionSort,
} from '@/domain/filters';
import type { Account, Category, ID, Transaction } from '@/domain/models';

export interface TransactionsState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  filter: TransactionFilter;
  sort: TransactionSort;
  loadData: (repo?: AppRepository) => Promise<void>;
  createTransaction: (
    dto: CreateTransactionDTO,
    repo?: AppRepository,
  ) => Promise<Transaction>;
  updateTransaction: (
    id: ID,
    dto: UpdateTransactionDTO,
    repo?: AppRepository,
  ) => Promise<Transaction>;
  deleteTransaction: (id: ID, repo?: AppRepository) => Promise<void>;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  resetFilter: () => void;
  setSort: (sort: TransactionSort) => void;
  getFilteredTransactions: () => Transaction[];
}

const initialSeed = getDemoSeedData();

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: initialSeed.transactions,
  accounts: initialSeed.accounts,
  categories: initialSeed.categories,
  isLoading: false,
  error: null,
  filter: {},
  sort: { by: 'date', direction: 'desc' },

  loadData: async (customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ isLoading: true, error: null });

    try {
      let transactions = await repo.transactions.getAll();
      let accounts = await repo.accounts.getAll();
      let categories = await repo.categories.getAll();

      // Precargar seed demo si no hay datos
      if (transactions.length === 0 && accounts.length === 0) {
        const seed = getDemoSeedData();
        await repo.importJSON(seed, 'replace');
        transactions = await repo.transactions.getAll();
        accounts = await repo.accounts.getAll();
        categories = await repo.categories.getAll();
      }

      set({ transactions, accounts, categories, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar transacciones',
        isLoading: false,
      });
    }
  },

  createTransaction: async (dto: CreateTransactionDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ error: null });

    try {
      const created = await repo.transactions.create(dto);
      set((state) => ({ transactions: [created, ...state.transactions] }));
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear transacción';
      set({ error: msg });
      throw err;
    }
  },

  updateTransaction: async (
    id: ID,
    dto: UpdateTransactionDTO,
    customRepo?: AppRepository,
  ) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ error: null });

    try {
      const updated = await repo.transactions.update(id, dto);
      set((state) => ({
        transactions: state.transactions.map((tx) => (tx.id === id ? updated : tx)),
      }));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar transacción';
      set({ error: msg });
      throw err;
    }
  },

  deleteTransaction: async (id: ID, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ error: null });

    try {
      await repo.transactions.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((tx) => tx.id !== id),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar transacción';
      set({ error: msg });
      throw err;
    }
  },

  setFilter: (partialFilter: Partial<TransactionFilter>) => {
    set((state) => ({
      filter: { ...state.filter, ...partialFilter },
    }));
  },

  resetFilter: () => {
    set({ filter: {} });
  },

  setSort: (sort: TransactionSort) => {
    set({ sort });
  },

  getFilteredTransactions: () => {
    const { transactions, filter, sort } = get();
    const filtered = filterTransactions(transactions, filter);
    return sortTransactions(filtered, sort);
  },
}));
