import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoalCard } from './GoalCard';
import type { Account } from '@/domain/models';
import type { GoalProgress } from '@/domain/budgets';

describe('GoalCard', () => {
  const mockProgress: GoalProgress = {
    goal: {
      id: 'g-1',
      name: 'Fondo de Emergencia',
      targetAmount: 5000000, // $50,000.00 DOP
      linkedAccountId: 'acc-savings',
      deadline: '2026-12-31',
    },
    current: 4000000, // $40,000.00 DOP (80%)
    remaining: 1000000,
    ratio: 0.8,
    reached: false,
  };

  const mockAccount: Account = {
    id: 'acc-savings',
    name: 'Cuenta de Ahorro',
    type: 'savings',
    currency: 'DOP',
    openingBalance: 4000000,
    color: '#4edea3',
    archived: false,
    createdAt: '2026-01-01',
  };

  it('renders goal name, progress and linked account indicator', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GoalCard
        progress={mockProgress}
        linkedAccount={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Fondo de Emergencia')).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
    expect(screen.getByText('Cuenta de Ahorro')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /editar meta/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProgress.goal);

    fireEvent.click(screen.getByRole('button', { name: /eliminar meta/i }));
    expect(onDelete).toHaveBeenCalledWith(mockProgress.goal);
  });

  it('renders reached badge when goal is completed', () => {
    const reachedProgress: GoalProgress = {
      ...mockProgress,
      current: 5500000,
      remaining: 0,
      ratio: 1.1,
      reached: true,
    };

    render(
      <GoalCard
        progress={reachedProgress}
        linkedAccount={mockAccount}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/alcanzada|completada/i)).toBeInTheDocument();
  });
});
