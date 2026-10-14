import { describe, expect, it } from 'vitest';
import type { AppRepository, BackupData } from './repository';

export function runRepositoryContractTests(
  name: string,
  factory: () => Promise<AppRepository>,
  cleanup?: (repo: AppRepository) => Promise<void>
) {
  describe(`Contract Tests: ${name}`, () => {
    async function setupRepo() {
      const repo = await factory();
      await repo.clearAll();
      return repo;
    }

    // ── Accounts ─────────────────────────────────────────────────────────────
    describe('Accounts', () => {
      it('creates and retrieves accounts by ID, active filter, and all', async () => {
        const repo = await setupRepo();

        const acc1 = await repo.accounts.create({
          name: 'Checking',
          type: 'checking',
          currency: 'DOP',
          openingBalance: 500000,
          color: '#4edea3',
          archived: false,
        });

        expect(acc1.id).toBeDefined();
        expect(acc1.name).toBe('Checking');
        expect(acc1.openingBalance).toBe(500000);
        expect(acc1.createdAt).toBeDefined();

        const acc2 = await repo.accounts.create({
          id: 'acc-custom',
          name: 'Old Card',
          type: 'credit_card',
          currency: 'DOP',
          openingBalance: -15000,
          creditLimit: 5000000,
          color: '#ffb4ab',
          archived: true,
        });

        expect(acc2.id).toBe('acc-custom');
        expect(acc2.archived).toBe(true);

        const fetched1 = await repo.accounts.getById(acc1.id);
        expect(fetched1).toEqual(acc1);

        const all = await repo.accounts.getAll();
        expect(all).toHaveLength(2);

        const active = await repo.accounts.getActive();
        expect(active).toHaveLength(1);
        expect(active[0]?.id).toBe(acc1.id);

        if (cleanup) await cleanup(repo);
      });

      it('updates and deletes accounts, and handles non-existent entities', async () => {
        const repo = await setupRepo();

        const acc = await repo.accounts.create({
          name: 'Savings',
          type: 'savings',
          currency: 'USD',
          openingBalance: 100000,
          color: '#4cd7f6',
          archived: false,
        });

        const updated = await repo.accounts.update(acc.id, {
          name: 'High Yield Savings',
          openingBalance: 120000,
          archived: true,
        });

        expect(updated.name).toBe('High Yield Savings');
        expect(updated.openingBalance).toBe(120000);
        expect(updated.archived).toBe(true);

        await repo.accounts.delete(acc.id);
        const deleted = await repo.accounts.getById(acc.id);
        expect(deleted).toBeNull();

        await expect(repo.accounts.update('non-existent', { name: 'X' })).rejects.toThrow(
          /no encontrada/i
        );
        await expect(repo.accounts.delete('non-existent')).rejects.toThrow(/no encontrada/i);

        if (cleanup) await cleanup(repo);
      });
    });

    // ── Transactions ──────────────────────────────────────────────────────────
    describe('Transactions', () => {
      it('creates and queries transactions by account, date range, and category', async () => {
        const repo = await setupRepo();

        const tx1 = await repo.transactions.create({
          type: 'income',
          accountId: 'acc-1',
          amount: 350000,
          date: '2026-03-01',
          description: 'Payroll',
          categoryId: 'cat-inc',
        });

        const tx2 = await repo.transactions.create({
          type: 'expense',
          accountId: 'acc-1',
          amount: 15000,
          date: '2026-03-15',
          description: 'Groceries',
          categoryId: 'cat-groc',
        });

        const tx3 = await repo.transactions.create({
          type: 'expense',
          accountId: 'acc-2',
          amount: 5000,
          date: '2026-04-01',
          description: 'Coffee',
          categoryId: 'cat-din',
        });

        const all = await repo.transactions.getAll();
        expect(all).toHaveLength(3);
        // Debe venir ordenado por fecha desc
        expect(all[0]?.id).toBe(tx3.id);
        expect(all[0]?.date).toBe('2026-04-01');
        expect(all[2]?.date).toBe('2026-03-01');

        const byAcc = await repo.transactions.getByAccount('acc-1');
        expect(byAcc).toHaveLength(2);
        expect(byAcc.map((t) => t.id)).toEqual([tx2.id, tx1.id]);

        const byRange = await repo.transactions.getByDateRange('2026-03-10', '2026-03-31');
        expect(byRange).toHaveLength(1);
        expect(byRange[0]?.id).toBe(tx2.id);

        const byCat = await repo.transactions.getByCategory('cat-inc');
        expect(byCat).toHaveLength(1);
        expect(byCat[0]?.id).toBe(tx1.id);

        if (cleanup) await cleanup(repo);
      });

      it('updates and deletes transactions', async () => {
        const repo = await setupRepo();

        const tx = await repo.transactions.create({
          type: 'expense',
          accountId: 'acc-1',
          amount: 2000,
          date: '2026-03-05',
          description: 'Snack',
          categoryId: null,
        });

        const updated = await repo.transactions.update(tx.id, {
          amount: 2500,
          notes: 'Updated snack',
        });

        expect(updated.amount).toBe(2500);
        expect(updated.notes).toBe('Updated snack');
        expect(updated.updatedAt).toBeDefined();

        await repo.transactions.delete(tx.id);
        expect(await repo.transactions.getById(tx.id)).toBeNull();

        await expect(repo.transactions.update('ghost', { amount: 100 })).rejects.toThrow(
          /no encontrada/i
        );
        await expect(repo.transactions.delete('ghost')).rejects.toThrow(/no encontrada/i);

        if (cleanup) await cleanup(repo);
      });
    });

    // ── Categories ────────────────────────────────────────────────────────────
    describe('Categories', () => {
      it('creates and filters categories by kind', async () => {
        const repo = await setupRepo();

        const c1 = await repo.categories.create({
          name: 'Supermercado',
          kind: 'expense',
          icon: 'shopping_basket',
          color: '#4edea3',
          keywords: ['super', 'market', 'foods'],
        });

        const c2 = await repo.categories.create({
          name: 'Sueldo',
          kind: 'income',
          icon: 'payments',
          color: '#4cd7f6',
          keywords: ['nomina', 'salario'],
        });

        const all = await repo.categories.getAll();
        expect(all).toHaveLength(2);

        const expenses = await repo.categories.getByKind('expense');
        expect(expenses).toHaveLength(1);
        expect(expenses[0]?.id).toBe(c1.id);

        const incomes = await repo.categories.getByKind('income');
        expect(incomes).toHaveLength(1);
        expect(incomes[0]?.id).toBe(c2.id);

        await repo.categories.delete(c1.id);
        expect(await repo.categories.getById(c1.id)).toBeNull();

        if (cleanup) await cleanup(repo);
      });
    });

    // ── Budgets ───────────────────────────────────────────────────────────────
    describe('Budgets', () => {
      it('creates and queries budgets by month and category', async () => {
        const repo = await setupRepo();

        const b1 = await repo.budgets.create({
          categoryId: 'cat-groc',
          monthlyLimit: 2500000,
          alertThreshold: 0.8,
          startMonth: '2026-01',
        });

        const b2 = await repo.budgets.create({
          categoryId: 'cat-ent',
          monthlyLimit: 1000000,
          alertThreshold: 0.85,
          startMonth: '2026-03',
        });

        const byMonth = await repo.budgets.getByMonth('2026-01');
        expect(byMonth).toHaveLength(1);
        expect(byMonth[0]?.id).toBe(b1.id);

        const byCat = await repo.budgets.getByCategory('cat-ent');
        expect(byCat?.id).toBe(b2.id);

        const updated = await repo.budgets.update(b1.id, {
          monthlyLimit: 3000000,
        });
        expect(updated.monthlyLimit).toBe(3000000);

        await repo.budgets.delete(b1.id);
        expect(await repo.budgets.getById(b1.id)).toBeNull();

        if (cleanup) await cleanup(repo);
      });
    });

    // ── Goals ─────────────────────────────────────────────────────────────────
    describe('Goals', () => {
      it('creates, updates, and deletes goals', async () => {
        const repo = await setupRepo();

        const goal = await repo.goals.create({
          name: 'Fondo Emergencia',
          targetAmount: 30000000,
          deadline: '2026-12-31',
        });

        expect(goal.id).toBeDefined();
        expect(goal.targetAmount).toBe(30000000);

        const updated = await repo.goals.update(goal.id, {
          targetAmount: 35000000,
          manualAmount: 5000000,
        });
        expect(updated.targetAmount).toBe(35000000);
        expect(updated.manualAmount).toBe(5000000);

        const all = await repo.goals.getAll();
        expect(all).toHaveLength(1);

        await repo.goals.delete(goal.id);
        expect(await repo.goals.getById(goal.id)).toBeNull();

        if (cleanup) await cleanup(repo);
      });
    });

    // ── Export / Import JSON & Clear ──────────────────────────────────────────
    describe('Export / Import / ClearAll', () => {
      it('exports full database and restores via replace and merge', async () => {
        const repo = await setupRepo();

        const acc = await repo.accounts.create({
          name: 'Cuenta Primaria',
          type: 'checking',
          currency: 'DOP',
          openingBalance: 100000,
          color: '#4edea3',
          archived: false,
        });

        const cat = await repo.categories.create({
          name: 'Comida',
          kind: 'expense',
          icon: 'restaurant',
          color: '#ffb4ab',
          keywords: ['food'],
        });

        const tx = await repo.transactions.create({
          type: 'expense',
          accountId: acc.id,
          amount: 5000,
          date: '2026-03-20',
          description: 'Cena',
          categoryId: cat.id,
        });

        const b = await repo.budgets.create({
          categoryId: cat.id,
          monthlyLimit: 50000,
          alertThreshold: 0.8,
          startMonth: '2026-03',
        });

        const g = await repo.goals.create({
          name: 'Viaje',
          targetAmount: 2000000,
        });

        const backup = await repo.exportJSON();
        expect(backup.version).toBe(1);
        expect(backup.accounts).toHaveLength(1);
        expect(backup.transactions).toHaveLength(1);
        expect(backup.transactions[0]?.id).toBe(tx.id);
        expect(backup.categories).toHaveLength(1);
        expect(backup.budgets).toHaveLength(1);
        expect(backup.budgets[0]?.id).toBe(b.id);
        expect(backup.goals).toHaveLength(1);
        expect(backup.goals[0]?.id).toBe(g.id);

        // Limpiar
        await repo.clearAll();
        expect(await repo.accounts.getAll()).toHaveLength(0);
        expect(await repo.transactions.getAll()).toHaveLength(0);

        // Restaurar en modo 'replace'
        await repo.importJSON(backup, 'replace');
        expect(await repo.accounts.getAll()).toHaveLength(1);
        expect(await repo.transactions.getAll()).toHaveLength(1);
        expect(await repo.categories.getAll()).toHaveLength(1);
        expect(await repo.budgets.getAll()).toHaveLength(1);
        expect(await repo.goals.getAll()).toHaveLength(1);

        // Restaurar en modo 'merge' con nuevos elementos
        const extraBackup: BackupData = {
          version: 1,
          exportedAt: new Date().toISOString(),
          accounts: [
            {
              id: 'acc-merged',
              name: 'Merged Account',
              type: 'cash',
              currency: 'DOP',
              openingBalance: 5000,
              color: '#4edea3',
              archived: false,
              createdAt: new Date().toISOString(),
            },
          ],
          transactions: [],
          categories: [],
          budgets: [],
          goals: [],
        };

        await repo.importJSON(extraBackup, 'merge');
        const afterMerge = await repo.accounts.getAll();
        expect(afterMerge).toHaveLength(2);

        if (cleanup) await cleanup(repo);
      });
    });
  });
}
