import { balancesByAccount } from '@/domain/balances';
import { describe, expect, it } from 'vitest';
import { MemoryRepository } from './memory/MemoryRepository';
import { getDemoSeedData, seedDemoData } from './seed';

describe('Seed Data', () => {
  it('provides a valid BackupData structure with integer cents', () => {
    const data = getDemoSeedData();

    expect(data.version).toBe(1);
    expect(data.accounts.length).toBeGreaterThanOrEqual(4);
    expect(data.categories.length).toBeGreaterThanOrEqual(5);
    expect(data.transactions.length).toBeGreaterThanOrEqual(5);
    expect(data.budgets.length).toBeGreaterThanOrEqual(2);
    expect(data.goals.length).toBeGreaterThanOrEqual(1);

    for (const acc of data.accounts) {
      expect(Number.isInteger(acc.openingBalance)).toBe(true);
      if (acc.creditLimit !== undefined) {
        expect(Number.isInteger(acc.creditLimit)).toBe(true);
      }
    }

    for (const tx of data.transactions) {
      expect(Number.isInteger(tx.amount)).toBe(true);
      expect(tx.amount).toBeGreaterThan(0);
    }
  });

  it('populates an empty repository and respects idempotency', async () => {
    const repo = new MemoryRepository();

    // Primera siembra: debe sembrar con éxito
    const seededFirst = await seedDemoData(repo);
    expect(seededFirst).toBe(true);

    const accounts = await repo.accounts.getAll();
    const transactions = await repo.transactions.getAll();
    expect(accounts.length).toBeGreaterThanOrEqual(4);
    expect(transactions.length).toBeGreaterThanOrEqual(5);

    // Segunda siembra sin forzar: debe ser idempotente y devolver false sin alterar
    const seededSecond = await seedDemoData(repo);
    expect(seededSecond).toBe(false);
    expect(await repo.accounts.getAll()).toHaveLength(accounts.length);

    // Siembra con force: true debe reescribir
    const seededForce = await seedDemoData(repo, { force: true });
    expect(seededForce).toBe(true);
  });

  it('integrates cleanly with domain balance calculations', async () => {
    const repo = new MemoryRepository();
    await seedDemoData(repo);

    const accounts = await repo.accounts.getAll();
    const transactions = await repo.transactions.getAll();

    const balances = balancesByAccount(accounts, transactions);
    expect(balances.size).toBe(accounts.length);

    // Verificar que todas las cuentas tienen saldos calculados como enteros
    for (const [, balance] of balances) {
      expect(Number.isInteger(balance)).toBe(true);
    }
  });
});
