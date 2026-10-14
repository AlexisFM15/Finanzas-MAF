import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionFormModal } from './TransactionFormModal';
import type { Account, Category, Transaction } from '@/domain/models';

describe('TransactionFormModal', () => {
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
    {
      id: 'acc-2',
      name: 'Efectivo',
      type: 'cash',
      currency: 'DOP',
      openingBalance: 50000,
      color: '#d0bcff',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-food',
      name: 'Comida y Restaurantes',
      kind: 'expense',
      icon: 'utensils',
      color: '#ffb4ab',
      keywords: ['restaurante', 'pizza', 'uber eats'],
    },
    {
      id: 'cat-salary',
      name: 'Salario y Nómina',
      kind: 'income',
      icon: 'briefcase',
      color: '#4edea3',
      keywords: ['sueldo', 'nomina', 'salario'],
    },
  ];

  it('autocategorizes expense when typing matching keyword in description', () => {
    render(
      <TransactionFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={vi.fn()}
      />,
    );

    const descInput = screen.getByLabelText(/descripción/i);
    fireEvent.change(descInput, { target: { value: 'Cena pizza con amigos' } });

    // Should automatically select Comida y Restaurantes
    const catSelect = screen.getByLabelText(/categoría/i) as HTMLSelectElement;
    expect(catSelect.value).toBe('cat-food');
  });

  it('validates that transfer origin and destination are different', async () => {
    render(
      <TransactionFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={vi.fn()}
      />,
    );

    const typeSelect = screen.getByLabelText(/tipo/i);
    fireEvent.change(typeSelect, { target: { value: 'transfer' } });

    // Origin and destination set to same account
    const fromSelect = screen.getByLabelText(/cuenta de origen/i);
    const toSelect = screen.getByLabelText(/cuenta de destino/i);
    fireEvent.change(fromSelect, { target: { value: 'acc-1' } });
    fireEvent.change(toSelect, { target: { value: 'acc-1' } });

    fireEvent.change(screen.getByLabelText(/monto/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'Traspaso' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar transacción/i }));

    expect(
      await screen.findByText(/la cuenta de destino debe ser diferente a la de origen/i),
    ).toBeInTheDocument();
  });

  it('submits a valid new transaction', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <TransactionFormModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: 'Compra de medicamentos' },
    });
    fireEvent.change(screen.getByLabelText(/monto/i), {
      target: { value: '1250,75' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar transacción/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Compra de medicamentos',
          amount: 125075,
          type: 'expense',
        }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('populates fields in edit mode and submits update', async () => {
    const txToEdit: Transaction = {
      id: 'tx-existing',
      type: 'income',
      accountId: 'acc-1',
      amount: 4500000,
      date: '2026-02-10',
      description: 'Salario Mensual',
      categoryId: 'cat-salary',
      createdAt: '2026-02-10T10:00:00Z',
      updatedAt: '2026-02-10T10:00:00Z',
    };

    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TransactionFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        transactionToEdit={txToEdit}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/editar transacción/i)).toBeInTheDocument();
    const descInput = screen.getByLabelText(/descripción/i) as HTMLInputElement;
    expect(descInput.value).toBe('Salario Mensual');

    fireEvent.change(descInput, { target: { value: 'Salario Mensual + Bono' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar transacción/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Salario Mensual + Bono',
        }),
      );
    });
  });
});
