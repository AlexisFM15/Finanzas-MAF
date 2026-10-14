import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransactionSummaryBar } from './TransactionSummaryBar';
import type { Transaction } from '@/domain/models';

describe('TransactionSummaryBar', () => {
  const txs: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      accountId: 'acc-1',
      amount: 100000, // 1,000 DOP
      date: '2026-02-01',
      description: 'Salario',
      categoryId: null,
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 40000, // 400 DOP
      date: '2026-02-02',
      description: 'Comida',
      categoryId: null,
      createdAt: '2026-02-02',
      updatedAt: '2026-02-02',
    },
    {
      id: 'tx-3',
      type: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      amount: 20000, // Transfer doesn't affect income vs expense totals
      date: '2026-02-03',
      description: 'Transferencia a ahorros',
      categoryId: null,
      createdAt: '2026-02-03',
      updatedAt: '2026-02-03',
    },
  ];

  it('renders income, expense and net totals accurately', () => {
    render(<TransactionSummaryBar transactions={txs} currency="DOP" />);

    expect(screen.getByText(/ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/gastos/i)).toBeInTheDocument();
    expect(screen.getByText(/balance neto/i)).toBeInTheDocument();

    // 1000 income, 400 expense, 600 net
    expect(screen.getByText(/1000,00|1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/400,00/)).toBeInTheDocument();
    expect(screen.getByText(/600,00/)).toBeInTheDocument();
    expect(screen.getByText(/3 transacciones/i)).toBeInTheDocument();
  });
});
