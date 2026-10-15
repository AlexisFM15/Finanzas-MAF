import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetFormModal } from './BudgetFormModal';
import type { Category, Budget } from '@/domain/models';

describe('BudgetFormModal', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-dining',
      name: 'Restaurantes',
      kind: 'expense',
      icon: 'restaurant',
      color: '#ffb4ab',
      keywords: [],
    },
    {
      id: 'cat-groceries',
      name: 'Supermercado',
      kind: 'expense',
      icon: 'shopping_basket',
      color: '#d0bcff',
      keywords: [],
    },
  ];

  it('submits valid budget with parsed cents and alert threshold', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <BudgetFormModal
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        existingBudgets={[]}
        defaultMonth="2026-04"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: /nuevo presupuesto/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/categoría/i), { target: { value: 'cat-dining' } });
    fireEvent.change(screen.getByLabelText(/límite mensual/i), { target: { value: '500.00' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar presupuesto/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-dining',
        monthlyLimit: 50000,
        startMonth: '2026-04',
      }),
    );
  });

  it('initializes with existing budget values when editing', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existingBudget: Budget = {
      id: 'b-edit',
      categoryId: 'cat-groceries',
      monthlyLimit: 120000,
      alertThreshold: 0.9,
      startMonth: '2026-04',
    };

    render(
      <BudgetFormModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        existingBudgets={[existingBudget]}
        budgetToEdit={existingBudget}
        defaultMonth="2026-04"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: /editar presupuesto/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Supermercado')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guardar presupuesto/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-groceries',
        monthlyLimit: 120000,
        alertThreshold: 0.9,
      }),
    );
  });
});
