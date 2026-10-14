import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

describe('App & Router Shell (Google Stitch UI)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders the topbar with BPE branding and Dashboard subtitle', () => {
    render(<App />);
    expect(screen.getByText('BPE')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
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

  it('renders the navigation links for all main modules', () => {
    render(<App />);
    const mobileNav = screen.getByRole('navigation', { name: /navegación móvil/i });
    expect(mobileNav).toBeInTheDocument();

    for (const label of ['Dashboard', 'Transacciones', 'Presupuestos', 'Cuentas']) {
      expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('navigates to Transacciones when clicking the navigation link', async () => {
    render(<App />);

    const transactionsLinks = screen.getAllByRole('link', { name: /transacciones/i });
    expect(transactionsLinks.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(transactionsLinks[0]!);

    expect(await screen.findByText('Módulo de Transacciones')).toBeInTheDocument();
  });
});
