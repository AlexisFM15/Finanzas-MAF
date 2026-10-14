import { describe, expect, it } from 'vitest';
import { makeTransaction } from '@/test/factories';
import { filterTransactions, sortTransactions } from './filters';

describe('filterTransactions', () => {
  const t1 = makeTransaction({
    id: 't1',
    description: 'Café Central',
    notes: 'desayuno',
    type: 'expense',
    amount: 350,
    accountId: 'acc-1',
    categoryId: 'cat-food',
    date: '2026-02-10',
  });
  const t2 = makeTransaction({
    id: 't2',
    description: 'Nómina',
    type: 'income',
    amount: 250000,
    accountId: 'acc-1',
    categoryId: 'cat-salary',
    date: '2026-02-28',
  });
  const t3 = makeTransaction({
    id: 't3',
    description: 'Traspaso a ahorros',
    type: 'transfer',
    amount: 50000,
    accountId: 'acc-1',
    toAccountId: 'acc-savings',
    categoryId: null,
    date: '2026-03-01',
  });

  const all = [t1, t2, t3];

  it('returns all items when filter is empty or criteria are undefined', () => {
    const res = filterTransactions(all, {});
    expect(res).toHaveLength(3);
    expect(res).not.toBe(all); // fresh array
  });

  it('filters by search term in description or notes ignoring accents and casing', () => {
    expect(filterTransactions(all, { search: 'cafe' })).toEqual([t1]);
    expect(filterTransactions(all, { search: 'DESAYUNO' })).toEqual([t1]);
    expect(filterTransactions(all, { search: '   ' })).toEqual(all);
    expect(filterTransactions(all, { search: 'inexistente' })).toEqual([]);
  });

  it('filters by transaction types', () => {
    expect(filterTransactions(all, { types: ['income'] })).toEqual([t2]);
    expect(filterTransactions(all, { types: ['expense', 'transfer'] })).toEqual([t1, t3]);
    expect(filterTransactions(all, { types: [] })).toEqual(all);
  });

  it('filters by accountIds matching either origin account or destination account', () => {
    expect(filterTransactions(all, { accountIds: ['acc-savings'] })).toEqual([t3]);
    expect(filterTransactions(all, { accountIds: ['acc-1'] })).toEqual([t1, t2, t3]);
  });

  it('filters by categoryIds including null for uncategorized', () => {
    expect(filterTransactions(all, { categoryIds: [null] })).toEqual([t3]);
    expect(filterTransactions(all, { categoryIds: ['cat-food', null] })).toEqual([t1, t3]);
  });

  it('filters by date ranges inclusively', () => {
    expect(filterTransactions(all, { dateFrom: '2026-02-10', dateTo: '2026-02-28' })).toEqual([t1, t2]);
    expect(filterTransactions(all, { dateFrom: '2026-03-01' })).toEqual([t3]);
    expect(filterTransactions(all, { dateTo: '2026-02-09' })).toEqual([]);
  });

  it('filters by amount ranges inclusively', () => {
    expect(filterTransactions(all, { minAmount: 1000, maxAmount: 100000 })).toEqual([t3]);
    expect(filterTransactions(all, { maxAmount: 350 })).toEqual([t1]);
  });

  it('combines multiple filters as intersection (AND)', () => {
    const res = filterTransactions(all, {
      types: ['expense'],
      dateFrom: '2026-02-01',
      maxAmount: 500,
    });
    expect(res).toEqual([t1]);
  });
});

describe('sortTransactions', () => {
  const t1 = makeTransaction({ id: 't1', date: '2026-02-01', amount: 500, createdAt: '2026-02-01T10:00:00Z' });
  const t2 = makeTransaction({ id: 't2', date: '2026-02-05', amount: 100, createdAt: '2026-02-05T10:00:00Z' });
  const t3 = makeTransaction({ id: 't3', date: '2026-02-05', amount: 200, createdAt: '2026-02-05T12:00:00Z' });

  it('sorts by date descending by default with createdAt tie-breaker', () => {
    const sorted = sortTransactions([t1, t2, t3]);
    expect(sorted.map((t) => t.id)).toEqual(['t3', 't2', 't1']);
  });

  it('sorts by amount ascending and descending', () => {
    const asc = sortTransactions([t1, t2, t3], { by: 'amount', direction: 'asc' });
    expect(asc.map((t) => t.id)).toEqual(['t2', 't3', 't1']);

    const desc = sortTransactions([t1, t2, t3], { by: 'amount', direction: 'desc' });
    expect(desc.map((t) => t.id)).toEqual(['t1', 't3', 't2']);
  });

  it('does not mutate the source array', () => {
    const original = [t1, t2];
    const copy = [...original];
    sortTransactions(original, { by: 'amount', direction: 'desc' });
    expect(original).toEqual(copy);
  });
});
