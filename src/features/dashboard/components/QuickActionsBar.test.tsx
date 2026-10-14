import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickActionsBar } from './QuickActionsBar';

describe('QuickActionsBar', () => {
  it('renders all four action buttons with accessible labels', () => {
    render(<QuickActionsBar />);

    expect(screen.getByRole('button', { name: /deposit funds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transfer capital/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan bill/i })).toBeInTheDocument();
  });

  it('triggers callbacks when buttons are clicked', () => {
    const onDeposit = vi.fn();
    const onTransfer = vi.fn();
    const onExpense = vi.fn();
    const onScanBill = vi.fn();

    render(
      <QuickActionsBar
        onDeposit={onDeposit}
        onTransfer={onTransfer}
        onExpense={onExpense}
        onScanBill={onScanBill}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /deposit funds/i }));
    expect(onDeposit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /transfer capital/i }));
    expect(onTransfer).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
    expect(onExpense).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /scan bill/i }));
    expect(onScanBill).toHaveBeenCalledTimes(1);
  });
});
