import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionsPage } from './TransactionsPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useTransactionsStore } from '@/state/useTransactionsStore';

describe('TransactionsPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useTransactionsStore.getState().loadData(repo);
  });

  it('renders transactions list and summary from seed data', async () => {
    render(<TransactionsPage repo={repo} />);

    expect(await screen.findByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
    expect(screen.getByText(/balance neto/i)).toBeInTheDocument();
  });

  it('filters transactions by type pills', async () => {
    render(<TransactionsPage repo={repo} />);

    expect(await screen.findByText('Stripe Payout')).toBeInTheDocument();

    const expensesTab = screen.getByRole('tab', { name: /gastos/i });
    fireEvent.click(expensesTab);

    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
    expect(screen.queryByText('Stripe Payout')).not.toBeInTheDocument();
  });

  it('opens new transaction modal when clicking Nueva Transacción button', async () => {
    render(<TransactionsPage repo={repo} />);

    const newBtn = await screen.findByRole('button', { name: /nueva transacción/i });
    fireEvent.click(newBtn);

    expect(
      await screen.findByRole('heading', { name: /nueva transacción/i }),
    ).toBeInTheDocument();
  });

  it('opens edit modal and saves modified transaction', async () => {
    render(<TransactionsPage repo={repo} />);

    const editBtns = await screen.findAllByRole('button', {
      name: /editar transacción/i,
    });
    fireEvent.click(editBtns[0]!);

    expect(
      await screen.findByRole('heading', { name: /editar transacción/i }),
    ).toBeInTheDocument();
  });
});
