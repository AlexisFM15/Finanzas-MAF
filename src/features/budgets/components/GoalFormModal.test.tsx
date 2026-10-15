import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoalFormModal } from './GoalFormModal';
import type { Account, Goal } from '@/domain/models';

describe('GoalFormModal', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-savings',
      name: 'Banreservas Ahorros',
      type: 'savings',
      currency: 'DOP',
      openingBalance: 1000000,
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  it('submits valid goal with linked account and target amount', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <GoalFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre de la meta/i), {
      target: { value: 'Comprar Laptop' },
    });
    fireEvent.change(screen.getByLabelText(/monto objetivo/i), {
      target: { value: '2,000.00' },
    });
    fireEvent.change(screen.getByLabelText(/cuenta vinculada/i), {
      target: { value: 'acc-savings' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar meta/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Comprar Laptop',
        targetAmount: 200000,
        linkedAccountId: 'acc-savings',
      }),
    );
  });

  it('initializes with goal to edit and submits update', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existingGoal: Goal = {
      id: 'g-edit',
      name: 'Viaje a Japón',
      targetAmount: 30000000, // 300,000 DOP
      linkedAccountId: 'acc-savings',
      deadline: '2027-01-01',
    };

    render(
      <GoalFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        goalToEdit={existingGoal}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: /editar meta/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Viaje a Japón')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guardar meta/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Viaje a Japón',
        targetAmount: 30000000,
        linkedAccountId: 'acc-savings',
      }),
    );
  });
});
