import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroNetWorthCard } from './HeroNetWorthCard';
import type { Account, Transaction } from '@/domain/models';

describe('HeroNetWorthCard', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Banco BHD',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 5000000, // $50,000.00 DOP
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      name: 'Tarjeta Visa',
      type: 'credit_card',
      currency: 'DOP',
      openingBalance: -1000000, // -$10,000.00 DOP
      color: '#4cd7f6',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockTransactions: Transaction[] = [];

  it('renders net worth total calculated across accounts in DOP', () => {
    render(<HeroNetWorthCard accounts={mockAccounts} transactions={mockTransactions} />);

    expect(screen.getByText('Net Portfolio Worth')).toBeInTheDocument();
    expect(screen.getByText('$40,000.00')).toBeInTheDocument();
    expect(screen.getByText('DOP')).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    render(<HeroNetWorthCard accounts={[]} transactions={[]} isLoading={true} />);

    expect(screen.getByTestId('hero-net-worth-skeleton')).toBeInTheDocument();
  });
});
