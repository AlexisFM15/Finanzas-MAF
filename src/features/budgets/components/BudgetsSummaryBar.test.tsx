import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetsSummaryBar } from './BudgetsSummaryBar';
import type { BudgetProgress } from '@/domain/models';

describe('BudgetsSummaryBar', () => {
  const mockProgress: BudgetProgress[] = [
    {
      budget: {
        id: 'b-1',
        categoryId: 'cat-1',
        monthlyLimit: 100000,
        alertThreshold: 0.8,
        startMonth: '2026-04',
      },
      month: '2026-04',
      spent: 50000,
      remaining: 50000,
      ratio: 0.5,
      status: 'safe',
    },
  ];

  it('renders monthly totals and responds to month navigation', () => {
    const onMonthChange = vi.fn();
    render(
      <BudgetsSummaryBar
        month="2026-04"
        onMonthChange={onMonthChange}
        budgetsProgress={mockProgress}
      />,
    );

    expect(screen.getByText(/abril.*2026/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.000,00|\$1,000\.00|1000,00/i)).toBeInTheDocument(); // Total presupuestado

    const nextBtn = screen.getByRole('button', { name: /mes siguiente/i });
    fireEvent.click(nextBtn);
    expect(onMonthChange).toHaveBeenCalledWith('2026-05');

    const prevBtn = screen.getByRole('button', { name: /mes anterior/i });
    fireEvent.click(prevBtn);
    expect(onMonthChange).toHaveBeenCalledWith('2026-03');
  });
});
