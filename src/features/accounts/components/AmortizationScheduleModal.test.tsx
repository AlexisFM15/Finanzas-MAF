import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AmortizationScheduleModal } from './AmortizationScheduleModal';
import type { Account } from '@/domain/models';

describe('AmortizationScheduleModal', () => {
  const loanAccount: Account = {
    id: 'acc-loan-1',
    name: 'Préstamo Auto',
    type: 'loan',
    currency: 'DOP',
    openingBalance: -5000000,
    loan: {
      principal: 5000000, // $50,000.00 DOP
      annualRate: 0.12, // 12%
      termMonths: 12, // 12 months
      startDate: '2026-01-01',
    },
    color: '#ffb4ab',
    archived: false,
    createdAt: '2026-01-01',
  };

  it('renders schedule rows and monthly payment when open', () => {
    render(
      <AmortizationScheduleModal
        account={loanAccount}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/cuadro de amortización/i)).toBeInTheDocument();
    expect(screen.getByText('Préstamo Auto')).toBeInTheDocument();
    expect(screen.getByText(/cuota mensual/i)).toBeInTheDocument();

    // Table rows: 12 periods
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('calls onClose when clicking close button or backdrop', () => {
    const onClose = vi.fn();
    render(
      <AmortizationScheduleModal
        account={loanAccount}
        isOpen={true}
        onClose={onClose}
      />,
    );

    const closeBtn = screen.getAllByRole('button', { name: /cerrar/i })[0]!;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false or account is null', () => {
    const { container } = render(
      <AmortizationScheduleModal
        account={null}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles loan with 0% interest rate gracefully', () => {
    const zeroRateLoan: Account = {
      ...loanAccount,
      loan: {
        principal: 1200000, // 12,000
        annualRate: 0,
        termMonths: 12,
        startDate: '2026-01-01',
      },
    };

    render(
      <AmortizationScheduleModal
        account={zeroRateLoan}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
    // 12000 / 12 = 1000 per month
    expect(screen.getAllByText(/1000,00|1\.000,00/).length).toBeGreaterThanOrEqual(1);
  });
});
