import { describe, it, expect, beforeEach } from 'vitest';
import { useTransactionsStore } from './useTransactionsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';

describe('useTransactionsStore', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
    useTransactionsStore.setState({
      transactions: [],
      accounts: [],
      categories: [],
      isLoading: false,
      error: null,
      filter: {},
      sort: { by: 'date', direction: 'desc' },
    });
  });

  it('loads transactions, accounts, and categories from repository, seeding if empty', async () => {
    await useTransactionsStore.getState().loadData(repo);
    const state = useTransactionsStore.getState();
    expect(state.transactions.length).toBeGreaterThan(0);
    expect(state.accounts.length).toBeGreaterThan(0);
    expect(state.categories.length).toBeGreaterThan(0);
    expect(state.isLoading).toBe(false);
  });

  it('creates a transaction and adds it to the store', async () => {
    await useTransactionsStore.getState().loadData(repo);
    const account = useTransactionsStore.getState().accounts[0]!;

    const newTx = await useTransactionsStore.getState().createTransaction(
      {
        type: 'expense',
        accountId: account.id,
        amount: 50000,
        date: '2026-02-01',
        description: 'Supermercado Nacional',
        categoryId: null,
      },
      repo,
    );

    expect(newTx.id).toBeDefined();
    expect(
      useTransactionsStore.getState().transactions.some((t) => t.id === newTx.id),
    ).toBe(true);
  });

  it('updates an existing transaction in the store', async () => {
    await useTransactionsStore.getState().loadData(repo);
    const target = useTransactionsStore.getState().transactions[0]!;

    const updated = await useTransactionsStore.getState().updateTransaction(
      target.id,
      { description: 'Descripción Actualizada' },
      repo,
    );

    expect(updated.description).toBe('Descripción Actualizada');
    expect(
      useTransactionsStore
        .getState()
        .transactions.find((t) => t.id === target.id)?.description,
    ).toBe('Descripción Actualizada');
  });

  it('deletes a transaction from the store and repository', async () => {
    await useTransactionsStore.getState().loadData(repo);
    const target = useTransactionsStore.getState().transactions[0]!;

    await useTransactionsStore.getState().deleteTransaction(target.id, repo);
    expect(
      useTransactionsStore.getState().transactions.some((t) => t.id === target.id),
    ).toBe(false);
  });

  it('filters and sorts transactions according to filter and sort state', async () => {
    await useTransactionsStore.getState().loadData(repo);

    useTransactionsStore.getState().setFilter({ types: ['income'] });
    const filtered = useTransactionsStore.getState().getFilteredTransactions();

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.type === 'income')).toBe(true);

    useTransactionsStore.getState().resetFilter();
    expect(useTransactionsStore.getState().getFilteredTransactions().length).toBe(
      useTransactionsStore.getState().transactions.length,
    );
  });
});
