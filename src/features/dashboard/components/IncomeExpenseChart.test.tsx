import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import type { Transaction } from '@/domain/models';

describe('IncomeExpenseChart', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      accountId: 'acc-1',
      amount: 500000, // $5,000.00 DOP
      date: '2026-04-10',
      description: 'Salario',
      categoryId: 'cat-1',
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 200000, // $2,000.00 DOP
      date: '2026-04-15',
      description: 'Supermercado',
      categoryId: 'cat-2',
      createdAt: '2026-04-15T00:00:00.000Z',
      updatedAt: '2026-04-15T00:00:00.000Z',
    },
  ];

  it('renders chart container and title', () => {
    render(<IncomeExpenseChart transactions={mockTransactions} />);

    expect(screen.getByText(/comparativa mensual/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresos vs gastos/i)).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    render(<IncomeExpenseChart transactions={[]} isLoading={true} />);

    expect(screen.getByTestId('income-expense-chart-skeleton')).toBeInTheDocument();
  });
});
