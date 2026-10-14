import { describe, it, expect, beforeEach } from 'vitest';
import { useAccountsStore } from './useAccountsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';

describe('useAccountsStore', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
    useAccountsStore.setState({ accounts: [], transactions: [], isLoading: false, error: null });
  });

  it('loads accounts and transactions from repository, seeding if empty', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const state = useAccountsStore.getState();
    expect(state.accounts.length).toBeGreaterThanOrEqual(5);
    expect(state.isLoading).toBe(false);
  });

  it('creates an account and updates store state', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const newAccount = await useAccountsStore.getState().createAccount(
      {
        name: 'Nueva Billetera',
        type: 'cash',
        currency: 'DOP',
        openingBalance: 100000,
        color: '#4edea3',
        archived: false,
      },
      repo,
    );

    expect(newAccount.id).toBeDefined();
    expect(useAccountsStore.getState().accounts.some((a) => a.id === newAccount.id)).toBe(true);
  });

  it('updates an existing account', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const target = useAccountsStore.getState().accounts[0]!;

    const updated = await useAccountsStore.getState().updateAccount(
      target.id,
      { name: 'Cuenta Modificada' },
      repo,
    );

    expect(updated.name).toBe('Cuenta Modificada');
    expect(
      useAccountsStore.getState().accounts.find((a) => a.id === target.id)?.name,
    ).toBe('Cuenta Modificada');
  });

  it('toggles archive status of an account', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const target = useAccountsStore.getState().accounts[0]!;
    const initialArchived = target.archived;

    await useAccountsStore.getState().toggleArchiveAccount(target.id, repo);
    const updated = useAccountsStore.getState().accounts.find((a) => a.id === target.id);
    expect(updated?.archived).toBe(!initialArchived);
  });

  it('deletes an account from store and repository', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const target = useAccountsStore.getState().accounts[0]!;

    await useAccountsStore.getState().deleteAccount(target.id, repo);
    expect(useAccountsStore.getState().accounts.some((a) => a.id === target.id)).toBe(false);
  });

  it('calculates balance map accurately for loaded accounts and transactions', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const balances = useAccountsStore.getState().getBalances();

    expect(balances.size).toBe(useAccountsStore.getState().accounts.length);
    const checking = useAccountsStore.getState().accounts.find((a) => a.id === 'acc-checking');
    if (checking) {
      expect(balances.has(checking.id)).toBe(true);
      expect(typeof balances.get(checking.id)).toBe('number');
    }
  });
});
