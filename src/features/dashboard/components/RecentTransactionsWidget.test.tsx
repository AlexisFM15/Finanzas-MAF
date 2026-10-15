import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { RecentTransactionsWidget } from './RecentTransactionsWidget';
import type { Account, Category, Transaction } from '@/domain/models';

describe('RecentTransactionsWidget', () => {
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
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Tech',
      kind: 'expense',
      icon: 'storefront',
      color: '#4cd7f6',
      keywords: [],
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      accountId: 'acc-1',
      amount: 385000,
      date: '2026-04-22',
      description: 'Stripe Payout',
      createdAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 124900,
      date: '2026-04-21',
      description: 'Apple Retail Store',
      categoryId: 'cat-1',
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    },
  ];

  it('renders recent transactions and filters by tabs', () => {
    render(
      <MemoryRouter>
        <RecentTransactionsWidget
          transactions={mockTransactions}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();

    const incomesTab = screen.getByRole('tab', { name: 'Incomes' });
    fireEvent.click(incomesTab);

    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.queryByText('Apple Retail Store')).not.toBeInTheDocument();

    const expensesTab = screen.getByRole('tab', { name: 'Expenses' });
    fireEvent.click(expensesTab);

    expect(screen.queryByText('Stripe Payout')).not.toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    render(
      <MemoryRouter>
        <RecentTransactionsWidget
          transactions={[]}
          accounts={[]}
          categories={[]}
          isLoading={true}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('recent-transactions-skeleton')).toBeInTheDocument();
  });
});
