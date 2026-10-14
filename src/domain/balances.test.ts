import { describe, expect, it } from 'vitest';
import { makeAccount, makeTransaction } from '@/test/factories';
import {
  accountBalance,
  availableCredit,
  balancesByAccount,
  netWorthByCurrency,
  transactionDelta,
} from './balances';

describe('transactionDelta', () => {
  it('adds for income on the account', () => {
    const tx = makeTransaction({ type: 'income', accountId: 'acc-1', amount: 5000 });
    expect(transactionDelta(tx, 'acc-1')).toBe(5000);
  });

  it('subtracts for expense on the account', () => {
    const tx = makeTransaction({ type: 'expense', accountId: 'acc-1', amount: 3000 });
    expect(transactionDelta(tx, 'acc-1')).toBe(-3000);
  });

  it('subtracts for transfer from the account and adds for transfer to the account', () => {
    const tx = makeTransaction({
      type: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      amount: 4000,
    });
    expect(transactionDelta(tx, 'acc-1')).toBe(-4000);
    expect(transactionDelta(tx, 'acc-2')).toBe(4000);
  });

  it('returns 0 for transfer to the same account', () => {
    const tx = makeTransaction({
      type: 'transfer',
      accountId: 'acc-1',
      toAccountId: 'acc-1',
      amount: 4000,
    });
    expect(transactionDelta(tx, 'acc-1')).toBe(0);
  });

  it('returns 0 for an unrelated account', () => {
    const tx = makeTransaction({ type: 'income', accountId: 'acc-1', amount: 5000 });
    expect(transactionDelta(tx, 'acc-99')).toBe(0);
  });
});

describe('accountBalance', () => {
  it('combines opening balance with income, expense and transfers', () => {
    const account = makeAccount({ id: 'acc-1', openingBalance: 10000 });
    const txs = [
      makeTransaction({ type: 'income', accountId: 'acc-1', amount: 5000 }),
      makeTransaction({ type: 'expense', accountId: 'acc-1', amount: 2000 }),
      makeTransaction({ type: 'transfer', accountId: 'acc-1', toAccountId: 'acc-2', amount: 1000 }),
      makeTransaction({ type: 'transfer', accountId: 'acc-3', toAccountId: 'acc-1', amount: 300 }),
    ];
    // 10000 + 5000 - 2000 - 1000 + 300 = 12300
    expect(accountBalance(account, txs)).toBe(12300);
  });

  it('calculates credit card negative balance correctly', () => {
    const card = makeAccount({
      id: 'card-1',
      type: 'credit_card',
      openingBalance: -20000,
    });
    const txs = [
      makeTransaction({ type: 'expense', accountId: 'card-1', amount: 5000 }),
    ];
    // -20000 - 5000 = -25000
    expect(accountBalance(card, txs)).toBe(-25000);
  });
});

describe('balancesByAccount', () => {
  it('computes balances for multiple accounts including empty ones', () => {
    const acc1 = makeAccount({ id: 'acc-1', openingBalance: 5000 });
    const acc2 = makeAccount({ id: 'acc-2', openingBalance: 12000 });
    const txs = [
      makeTransaction({ type: 'expense', accountId: 'acc-1', amount: 1000 }),
    ];
    const map = balancesByAccount([acc1, acc2], txs);
    expect(map.get('acc-1')).toBe(4000);
    expect(map.get('acc-2')).toBe(12000);
  });
});

describe('netWorthByCurrency', () => {
  it('groups by currency and includes archived accounts without leakage on transfers', () => {
    const eurChecking = makeAccount({ id: 'acc-1', currency: 'EUR', openingBalance: 100000 });
    const eurCredit = makeAccount({ id: 'acc-2', currency: 'EUR', openingBalance: -30000 });
    const usdSavings = makeAccount({ id: 'acc-3', currency: 'USD', openingBalance: 5000 });
    const archivedEur = makeAccount({ id: 'acc-4', currency: 'EUR', openingBalance: 1000, archived: true });

    const txs = [
      // Transfer between EUR accounts preserves EUR net worth
      makeTransaction({ type: 'transfer', accountId: 'acc-1', toAccountId: 'acc-2', amount: 20000 }),
    ];

    const netWorth = netWorthByCurrency([eurChecking, eurCredit, usdSavings, archivedEur], txs);
    // EUR: 100000 - 30000 + 1000 = 71000
    expect(netWorth.get('EUR')).toBe(71000);
    expect(netWorth.get('USD')).toBe(5000);
  });
});

describe('availableCredit', () => {
  it('calculates available credit for credit cards with a credit limit', () => {
    const card = makeAccount({
      type: 'credit_card',
      creditLimit: 100000,
    });
    // Limit 1000.00, balance -250.00 -> available 750.00 (75000 cents)
    expect(availableCredit(card, -25000)).toBe(75000);
  });

  it('returns null for accounts that are not credit cards or lack a credit limit', () => {
    const checking = makeAccount({ type: 'checking', creditLimit: 50000 });
    expect(availableCredit(checking, 10000)).toBeNull();

    const noLimitCard = makeAccount({ type: 'credit_card' });
    expect(availableCredit(noLimitCard, -10000)).toBeNull();
  });
});
