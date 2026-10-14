import type { Account, Cents, CurrencyCode, ID, Transaction } from './models';
import { assertCents, sumCents } from './money';

/**
 * Calcula el impacto neto de una transacción en una cuenta específica.
 * Devuelve 0 si la cuenta no participa o si es una transferencia interna a la misma cuenta.
 */
export function transactionDelta(tx: Transaction, accountId: ID): Cents {
  assertCents(tx.amount, 'importe de la transacción');

  if (tx.type === 'transfer') {
    if (tx.accountId === accountId && tx.toAccountId === accountId) {
      return 0;
    }
    if (tx.accountId === accountId) {
      return -tx.amount;
    }
    if (tx.toAccountId === accountId) {
      return tx.amount;
    }
    return 0;
  }

  if (tx.accountId === accountId) {
    return tx.type === 'income' ? tx.amount : -tx.amount;
  }

  return 0;
}

/** Calcula el saldo actual de una cuenta (saldo de apertura + deltas de transacciones). */
export function accountBalance(
  account: Account,
  transactions: readonly Transaction[],
): Cents {
  assertCents(account.openingBalance, 'saldo de apertura');
  const deltas = transactions.map((tx) => transactionDelta(tx, account.id));
  return sumCents([account.openingBalance, ...deltas]);
}

/** Calcula los saldos de una lista de cuentas indexados por su ID. */
export function balancesByAccount(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
): ReadonlyMap<ID, Cents> {
  const map = new Map<ID, Cents>();
  for (const account of accounts) {
    map.set(account.id, accountBalance(account, transactions));
  }
  return map;
}

/**
 * Calcula el patrimonio neto agrupado por divisa.
 * Incluye todas las cuentas (activas y archivadas).
 */
export function netWorthByCurrency(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
): ReadonlyMap<CurrencyCode, Cents> {
  const balances = balancesByAccount(accounts, transactions);
  const byCurrency = new Map<CurrencyCode, Cents[]>();

  for (const account of accounts) {
    const balance = balances.get(account.id)!;
    const existing = byCurrency.get(account.currency);

    if (existing) {
      existing.push(balance);
    } else {
      byCurrency.set(account.currency, [balance]);
    }
  }

  const result = new Map<CurrencyCode, Cents>();
  for (const [currency, amounts] of byCurrency.entries()) {
    result.set(currency, sumCents(amounts));
  }
  return result;
}

/**
 * Devuelve el crédito disponible para tarjetas de crédito con límite asignado.
 * Devuelve `null` si no es tarjeta de crédito o no tiene límite definido.
 */
export function availableCredit(account: Account, balance: Cents): Cents | null {
  assertCents(balance, 'saldo');
  if (account.type !== 'credit_card' || account.creditLimit === undefined) {
    return null;
  }
  assertCents(account.creditLimit, 'límite de crédito');
  return sumCents([account.creditLimit, balance]);
}
