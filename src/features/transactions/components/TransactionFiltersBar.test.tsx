import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionFiltersBar } from './TransactionFiltersBar';
import type { Account, Category } from '@/domain/models';

describe('TransactionFiltersBar', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Banco BHD',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 100000,
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Alimentación',
      kind: 'expense',
      icon: 'shopping-cart',
      color: '#ffb4ab',
      keywords: ['supermercado'],
    },
  ];

  it('triggers search update on input', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFiltersBar
        filter={{}}
        accounts={mockAccounts}
        categories={mockCategories}
        onFilterChange={onFilterChange}
        onResetFilter={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/buscar transacciones/i);
    fireEvent.change(searchInput, { target: { value: 'Stripe' } });

    expect(onFilterChange).toHaveBeenCalledWith({ search: 'Stripe' });
  });

  it('triggers type filter when clicking Ingresos tab', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFiltersBar
        filter={{}}
        accounts={mockAccounts}
        categories={mockCategories}
        onFilterChange={onFilterChange}
        onResetFilter={vi.fn()}
      />,
    );

    const incomeTab = screen.getByRole('tab', { name: /ingresos/i });
    fireEvent.click(incomeTab);

    expect(onFilterChange).toHaveBeenCalledWith({ types: ['income'] });
  });

  it('calls onResetFilter when clicking clear filters button', () => {
    const onResetFilter = vi.fn();
    render(
      <TransactionFiltersBar
        filter={{ search: 'Stripe', types: ['income'] }}
        accounts={mockAccounts}
        categories={mockCategories}
        onFilterChange={vi.fn()}
        onResetFilter={onResetFilter}
      />,
    );

    const resetBtn = screen.getByRole('button', { name: /limpiar filtros/i });
    fireEvent.click(resetBtn);

    expect(onResetFilter).toHaveBeenCalled();
  });
});
