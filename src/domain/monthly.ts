import { monthRange, toYearMonth } from './dates';
import type { Cents, Transaction, YearMonth } from './models';
import { assertCents, sumCents } from './money';

export interface MonthlySummary {
  month: YearMonth;
  income: Cents;
  expense: Cents;
  net: Cents;
  savingsRate: number | null;
}

/**
 * Calcula el resumen de ingresos, gastos, flujo neto y tasa de ahorro de un mes.
 * Ignora transferencias.
 */
export function monthlySummary(
  transactions: readonly Transaction[],
  month: YearMonth,
): MonthlySummary {
  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const tx of transactions) {
    if (toYearMonth(tx.date) !== month) {
      continue;
    }
    assertCents(tx.amount, 'importe de transacción');
    if (tx.type === 'income') {
      incomeTotal += tx.amount;
    } else if (tx.type === 'expense') {
      expenseTotal += tx.amount;
    }
  }

  const income = assertCents(incomeTotal, 'ingresos del mes');
  const expense = assertCents(expenseTotal, 'gastos del mes');
  const net = sumCents([income, -expense]);
  const savingsRate = income > 0 ? (net / income) : null;

  return {
    month,
    income,
    expense,
    net,
    savingsRate,
  };
}

/**
 * Genera una serie cronológica continua de resúmenes mensuales entre `from` y `to`.
 */
export function monthlySeries(
  transactions: readonly Transaction[],
  from: YearMonth,
  to: YearMonth,
): MonthlySummary[] {
  const months = monthRange(from, to);
  return months.map((m) => monthlySummary(transactions, m));
}
