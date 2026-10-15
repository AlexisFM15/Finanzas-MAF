import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CategoryExpenseDonutChart } from './CategoryExpenseDonutChart';
import type { Category, Transaction } from '@/domain/models';

describe('CategoryExpenseDonutChart', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Supermercado',
      kind: 'expense',
      icon: 'shopping_basket',
      color: '#d0bcff',
      keywords: ['super'],
    },
    {
      id: 'cat-tech',
      name: 'Tecnología',
      kind: 'expense',
      icon: 'storefront',
      color: '#4cd7f6',
      keywords: ['apple'],
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'expense',
      accountId: 'acc-1',
      amount: 30000,
      date: '2026-04-10',
      description: 'Super',
      categoryId: 'cat-groceries',
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 70000,
      date: '2026-04-12',
      description: 'Apple Gadgets',
      categoryId: 'cat-tech',
      createdAt: '2026-04-12T00:00:00.000Z',
      updatedAt: '2026-04-12T00:00:00.000Z',
    },
  ];

  it('renders donut chart container and category legend labels', () => {
    render(<CategoryExpenseDonutChart transactions={mockTransactions} categories={mockCategories} />);

    expect(screen.getByText(/gastos por categoría/i)).toBeInTheDocument();
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText('Tecnología')).toBeInTheDocument();
  });

  it('renders empty state when there are no expenses', () => {
    render(<CategoryExpenseDonutChart transactions={[]} categories={mockCategories} />);

    expect(screen.getByText(/sin gastos registrados en este período/i)).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    render(<CategoryExpenseDonutChart transactions={[]} categories={mockCategories} isLoading={true} />);

    expect(screen.getByTestId('category-donut-chart-skeleton')).toBeInTheDocument();
  });
});
