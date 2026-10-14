import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccountsSummary } from './AccountsSummary';
import type { Account, ID, Cents } from '@/domain/models';

describe('AccountsSummary', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Corriente',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 5000000, // +$50,000.00 DOP
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      name: 'Tarjeta Visa',
      type: 'credit_card',
      currency: 'DOP',
      openingBalance: -1000000, // -$10,000.00 DOP deuda
      color: '#4cd7f6',
      archived: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'acc-3',
      name: 'Inversión Vanguard',
      type: 'savings',
      currency: 'USD',
      openingBalance: 150000, // +$1,500.00 USD
      color: '#facedf',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockBalances = new Map<ID, Cents>([
    ['acc-1', 5000000],
    ['acc-2', -1000000],
    ['acc-3', 150000],
  ]);

  it('renders Net Worth, Total Assets, and Total Liabilities with formatted currency for primary currency', () => {
    render(<AccountsSummary accounts={mockAccounts} balances={mockBalances} />);

    expect(screen.getByText(/patrimonio neto/i)).toBeInTheDocument();
    expect(screen.getByText(/activos totales/i)).toBeInTheDocument();
    expect(screen.getByText(/deuda total/i)).toBeInTheDocument();

    // Primary currency (DOP): Net worth = 50,000 - 10,000 = 40,000 DOP
    // Assets = 50,000 DOP
    // Debt = 10,000 DOP
    expect(screen.getByText(/40\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/50\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/10\.000,00/)).toBeInTheDocument();
  });

  it('displays secondary currency breakdown when multiple currencies are present', () => {
    render(<AccountsSummary accounts={mockAccounts} balances={mockBalances} />);

    // USD is present
    expect(screen.getByText(/usd/i)).toBeInTheDocument();
    expect(screen.getByText(/1500,00|1\.500,00/)).toBeInTheDocument();
  });

  it('renders zero balances gracefully when accounts list is empty', () => {
    render(<AccountsSummary accounts={[]} balances={new Map()} />);

    expect(screen.getByText(/patrimonio neto/i)).toBeInTheDocument();
    expect(screen.getAllByText(/0,00/).length).toBeGreaterThanOrEqual(1);
  });
});
