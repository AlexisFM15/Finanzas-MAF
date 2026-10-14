import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionItem } from './TransactionItem';
import type { Account, Category, Transaction } from '@/domain/models';

describe('TransactionItem', () => {
  const mockTx: Transaction = {
    id: 'tx-1',
    type: 'expense',
    accountId: 'acc-1',
    amount: 250000,
    date: '2026-02-15',
    description: 'Compra Supermercado',
    categoryId: 'cat-food',
    createdAt: '2026-02-15T12:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z',
  };

  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Banco BHD',
    type: 'checking',
    currency: 'DOP',
    openingBalance: 100000,
    color: '#4edea3',
    archived: false,
    createdAt: '2026-01-01',
  };

  const mockCategory: Category = {
    id: 'cat-food',
    name: 'Alimentación',
    kind: 'expense',
    icon: 'shopping-cart',
    color: '#ffb4ab',
    keywords: ['supermercado'],
  };

  it('renders transaction description, formatted expense amount and category', () => {
    render(
      <TransactionItem
        transaction={mockTx}
        account={mockAccount}
        category={mockCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Compra Supermercado')).toBeInTheDocument();
    expect(screen.getAllByText('Alimentación').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Banco BHD')).toBeInTheDocument();
    expect(screen.getByText(/2500,00|2\.500,00/)).toBeInTheDocument();
  });

  it('renders transfer details with source and destination accounts', () => {
    const transferTx: Transaction = {
      ...mockTx,
      id: 'tx-transfer-1',
      type: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      categoryId: null,
      description: 'Ahorro mensual',
    };

    const destAccount: Account = {
      ...mockAccount,
      id: 'acc-2',
      name: 'Banreservas Ahorros',
    };

    render(
      <TransactionItem
        transaction={transferTx}
        account={mockAccount}
        toAccount={destAccount}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Ahorro mensual')).toBeInTheDocument();
    expect(screen.getByText(/Banco BHD/)).toBeInTheDocument();
    expect(screen.getByText(/Banreservas Ahorros/)).toBeInTheDocument();
  });

  it('triggers onEdit and onDelete callbacks', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionItem
        transaction={mockTx}
        account={mockAccount}
        category={mockCategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const editBtn = screen.getByRole('button', { name: /editar transacción/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(mockTx);

    const deleteBtn = screen.getByRole('button', { name: /eliminar transacción/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(mockTx);
  });
});
