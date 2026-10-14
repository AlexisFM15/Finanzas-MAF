import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountCard } from './AccountCard';
import type { Account } from '@/domain/models';

describe('AccountCard', () => {
  const baseAccount: Account = {
    id: 'acc-card-1',
    name: 'Visa Signature',
    type: 'credit_card',
    currency: 'DOP',
    openingBalance: -2500000, // -$25,000 DOP balance
    creditLimit: 10000000, // $100,000 DOP limit
    institution: 'Banco Popular',
    color: '#4cd7f6',
    archived: false,
    createdAt: '2026-01-01',
  };

  it('renders credit card details with limit and available credit', () => {
    render(
      <AccountCard
        account={baseAccount}
        balance={-2500000}
        onEdit={vi.fn()}
        onToggleArchive={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Visa Signature')).toBeInTheDocument();
    expect(screen.getByText('Banco Popular')).toBeInTheDocument();
    expect(screen.getByText(/límite/i)).toBeInTheDocument();
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });

  it('renders loan action button and triggers onViewAmortization', () => {
    const loanAccount: Account = {
      ...baseAccount,
      id: 'acc-loan-1',
      name: 'Préstamo Auto',
      type: 'loan',
      loan: {
        principal: 5000000,
        annualRate: 0.12,
        termMonths: 36,
        startDate: '2025-06-01',
      },
    };
    const onViewAmortization = vi.fn();

    render(
      <AccountCard
        account={loanAccount}
        balance={-3500000}
        onEdit={vi.fn()}
        onToggleArchive={vi.fn()}
        onDelete={vi.fn()}
        onViewAmortization={onViewAmortization}
      />,
    );

    const amortBtn = screen.getByRole('button', { name: /tabla de amortización|amortización/i });
    expect(amortBtn).toBeInTheDocument();
    fireEvent.click(amortBtn);
    expect(onViewAmortization).toHaveBeenCalledWith(loanAccount);
  });

  it('triggers onEdit, onToggleArchive, and onDelete callbacks', () => {
    const onEdit = vi.fn();
    const onToggleArchive = vi.fn();
    const onDelete = vi.fn();

    render(
      <AccountCard
        account={baseAccount}
        balance={-2500000}
        onEdit={onEdit}
        onToggleArchive={onToggleArchive}
        onDelete={onDelete}
      />,
    );

    const editBtn = screen.getByRole('button', { name: /editar/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(baseAccount);

    const archiveBtn = screen.getByRole('button', { name: /archivar/i });
    fireEvent.click(archiveBtn);
    expect(onToggleArchive).toHaveBeenCalledWith(baseAccount);

    const deleteBtn = screen.getByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(baseAccount);
  });

  it('renders archived badge when account is archived', () => {
    const archivedAccount: Account = {
      ...baseAccount,
      archived: true,
    };

    render(
      <AccountCard
        account={archivedAccount}
        balance={0}
        onEdit={vi.fn()}
        onToggleArchive={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/archivada/i)).toBeInTheDocument();
  });
});
