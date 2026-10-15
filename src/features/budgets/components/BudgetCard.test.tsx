import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetCard } from './BudgetCard';
import type { BudgetProgress, Category } from '@/domain/models';

describe('BudgetCard', () => {
  const mockCategory: Category = {
    id: 'cat-groceries',
    name: 'Supermercado',
    kind: 'expense',
    icon: 'shopping_basket',
    color: '#d0bcff',
    keywords: [],
  };

  const mockProgress: BudgetProgress = {
    budget: {
      id: 'b-1',
      categoryId: 'cat-groceries',
      monthlyLimit: 100000, // $1,000.00 DOP
      alertThreshold: 0.8,
      startMonth: '2026-04',
    },
    month: '2026-04',
    spent: 85000, // $850.00 DOP (85% -> warning)
    remaining: 15000,
    ratio: 0.85,
    status: 'warning',
  };

  it('renders budget category, progress ratio and warning status badge', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <BudgetCard
        progress={mockProgress}
        category={mockCategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
    expect(screen.getByText(/alerta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /editar presupuesto/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProgress.budget);

    fireEvent.click(screen.getByRole('button', { name: /eliminar presupuesto/i }));
    expect(onDelete).toHaveBeenCalledWith(mockProgress.budget);
  });
});
