import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { DashboardPage } from './DashboardPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useAccountsStore } from '@/state/useAccountsStore';
import { useTransactionsStore } from '@/state/useTransactionsStore';

describe('DashboardPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useAccountsStore.getState().loadAccounts(repo);
    await useTransactionsStore.getState().loadData(repo);
  });

  it('renders hero net worth, charts, and recent movements from seed data', async () => {
    render(
      <MemoryRouter>
        <DashboardPage repo={repo} />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Net Portfolio Worth')).toBeInTheDocument();
    expect(screen.getByText('DOP')).toBeInTheDocument();
    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText(/comparativa mensual/i)).toBeInTheDocument();
  });

  it('opens TransactionFormModal when clicking Add Expense quick action', async () => {
    render(
      <MemoryRouter>
        <DashboardPage repo={repo} />
      </MemoryRouter>,
    );

    const expenseBtn = await screen.findByRole('button', { name: /add expense/i });
    fireEvent.click(expenseBtn);

    expect(await screen.findByRole('heading', { name: /nueva transacción/i })).toBeInTheDocument();
  });
});
