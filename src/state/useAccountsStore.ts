import { create } from 'zustand';
import { getDefaultRepository } from '@/data';
import type { AppRepository, CreateAccountDTO, UpdateAccountDTO } from '@/data/repository';
import { getDemoSeedData } from '@/data/seed';
import { balancesByAccount } from '@/domain/balances';
import type { Account, Cents, ID, Transaction } from '@/domain/models';

export interface AccountsState {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  loadAccounts: (repo?: AppRepository) => Promise<void>;
  createAccount: (dto: CreateAccountDTO, repo?: AppRepository) => Promise<Account>;
  updateAccount: (id: ID, dto: UpdateAccountDTO, repo?: AppRepository) => Promise<Account>;
  toggleArchiveAccount: (id: ID, repo?: AppRepository) => Promise<void>;
  deleteAccount: (id: ID, repo?: AppRepository) => Promise<void>;
  getBalances: () => ReadonlyMap<ID, Cents>;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  transactions: [],
  isLoading: false,
  error: null,

  loadAccounts: async (customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ isLoading: true, error: null });

    try {
      let accounts = await repo.accounts.getAll();
      let transactions = await repo.transactions.getAll();

      // Si el repositorio está completamente vacío, precargar el seed demo
      if (accounts.length === 0) {
        const seed = getDemoSeedData();
        await repo.importJSON(seed, 'replace');
        accounts = await repo.accounts.getAll();
        transactions = await repo.transactions.getAll();
      }

      set({ accounts, transactions, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar cuentas',
        isLoading: false,
      });
    }
  },

  createAccount: async (dto: CreateAccountDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ error: null });

    try {
      const created = await repo.accounts.create(dto);
      set((state) => ({ accounts: [...state.accounts, created] }));
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear cuenta';
      set({ error: msg });
      throw err;
    }
  },

  updateAccount: async (id: ID, dto: UpdateAccountDTO, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ error: null });

    try {
      const updated = await repo.accounts.update(id, dto);
      set((state) => ({
        accounts: state.accounts.map((acc) => (acc.id === id ? updated : acc)),
      }));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar cuenta';
      set({ error: msg });
      throw err;
    }
  },

  toggleArchiveAccount: async (id: ID, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    const account = get().accounts.find((acc) => acc.id === id);
    if (!account) return;

    set({ error: null });
    try {
      const updated = await repo.accounts.update(id, { archived: !account.archived });
      set((state) => ({
        accounts: state.accounts.map((acc) => (acc.id === id ? updated : acc)),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al alternar archivo de cuenta';
      set({ error: msg });
      throw err;
    }
  },

  deleteAccount: async (id: ID, customRepo?: AppRepository) => {
    const repo = customRepo ?? getDefaultRepository();
    set({ error: null });

    try {
      await repo.accounts.delete(id);
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc.id !== id),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar cuenta';
      set({ error: msg });
      throw err;
    }
  },

  getBalances: () => {
    const { accounts, transactions } = get();
    return balancesByAccount(accounts, transactions);
  },
}));
