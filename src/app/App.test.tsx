import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App & Dashboard (Google Stitch UI)', () => {
  it('renders the header with BPE branding and Dashboard subtitle', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('BPE');
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(2);
  });

  it('renders the hero net worth balance and currency', () => {
    render(<App />);
    expect(screen.getByText('Net Portfolio Worth')).toBeInTheDocument();
    expect(screen.getByText('$84,620.50')).toBeInTheDocument();
    expect(screen.getByText('DOP')).toBeInTheDocument();
  });

  it('renders quick action buttons: Deposit, Transfer, Expense, Scan Bill', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /deposit funds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transfer capital/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan bill/i })).toBeInTheDocument();
  });

  it('filters transactions when selecting All, Incomes, and Expenses tabs', () => {
    render(<App />);

    // Initial state: all transactions visible
    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();

    // Filter by Incomes only
    const incomesTab = screen.getByRole('tab', { name: 'Incomes' });
    fireEvent.click(incomesTab);

    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Vanguard Dividend Yield')).toBeInTheDocument();
    expect(screen.queryByText('Apple Retail Store')).not.toBeInTheDocument();

    // Filter by Expenses only
    const expensesTab = screen.getByRole('tab', { name: 'Expenses' });
    fireEvent.click(expensesTab);

    expect(screen.queryByText('Stripe Payout')).not.toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
    expect(screen.getByText('Whole Foods Market')).toBeInTheDocument();

    // Reset to All
    const allTab = screen.getByRole('tab', { name: 'All' });
    fireEvent.click(allTab);

    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
  });

  it('renders the bottom navigation tabs', () => {
    render(<App />);
    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    expect(nav).toBeInTheDocument();
    for (const label of ['Dashboard', 'Analytics', 'Market', 'Cards', 'Profile']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });
});
