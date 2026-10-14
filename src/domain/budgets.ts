import { toYearMonth } from './dates';
import type {
  Budget,
  BudgetProgress,
  BudgetStatus,
  Cents,
  Goal,
  ID,
  Transaction,
  YearMonth,
} from './models';
import { assertCents, sumCents } from './money';

export interface GoalProgress {
  goal: Goal;
  current: Cents;
  remaining: Cents;
  ratio: number;
  reached: boolean;
}

/**
 * Determina el estado de un presupuesto ('safe' | 'warning' | 'over'):
 * - spent <= 0: 'safe'
 * - spent > limit: 'over'
 * - spent >= limit * alertThreshold: 'warning'
 * - en otro caso: 'safe'
 */
export function budgetStatus(
  spent: Cents,
  limit: Cents,
  alertThreshold: number,
): BudgetStatus {
  assertCents(spent, 'gasto');
  assertCents(limit, 'límite');

  if (spent <= 0) return 'safe';
  if (spent > limit) return 'over';
  if (spent >= limit * alertThreshold) return 'warning';
  return 'safe';
}

/** Comprueba si el presupuesto está activo en el mes indicado (`month >= startMonth`). */
export function isBudgetActive(budget: Budget, month: YearMonth): boolean {
  return month >= budget.startMonth;
}

/** Calcula el progreso de un presupuesto en un mes determinado para transacciones de tipo 'expense'. */
export function budgetProgress(
  budget: Budget,
  transactions: readonly Transaction[],
  month: YearMonth,
): BudgetProgress {
  assertCents(budget.monthlyLimit, 'límite mensual');

  let spentTotal = 0;
  for (const tx of transactions) {
    if (tx.type === 'expense' && tx.categoryId === budget.categoryId && toYearMonth(tx.date) === month) {
      assertCents(tx.amount, 'importe de gasto');
      spentTotal += tx.amount;
    }
  }

  const spent = assertCents(spentTotal, 'gasto acumulado');
  const remaining = sumCents([budget.monthlyLimit, -spent]);
  const ratio = budget.monthlyLimit <= 0
    ? (spent > 0 ? 1 : 0)
    : (spent / budget.monthlyLimit);
  const status = budgetStatus(spent, budget.monthlyLimit, budget.alertThreshold);

  return {
    budget,
    month,
    spent,
    remaining,
    ratio,
    status,
  };
}

/** Calcula el progreso para todos los presupuestos activos en el mes especificado. */
export function budgetsProgress(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  month: YearMonth,
): BudgetProgress[] {
  return budgets
    .filter((b) => isBudgetActive(b, month))
    .map((b) => budgetProgress(b, transactions, month));
}

/**
 * Calcula el progreso de una meta de ahorro comparando su targetAmount con el saldo actual:
 * Si tiene linkedAccountId, toma el saldo positivo de esa cuenta; si no, toma manualAmount.
 */
export function goalProgress(
  goal: Goal,
  balances: ReadonlyMap<ID, Cents>,
): GoalProgress {
  assertCents(goal.targetAmount, 'monto objetivo');

  let rawCurrent = 0;
  if (goal.linkedAccountId !== undefined) {
    const accBal = balances.get(goal.linkedAccountId) ?? 0;
    rawCurrent = Math.max(0, accBal);
  } else if (goal.manualAmount !== undefined) {
    assertCents(goal.manualAmount, 'monto manual');
    rawCurrent = Math.max(0, goal.manualAmount);
  }

  const current = assertCents(rawCurrent, 'monto actual de la meta');
  const remaining = Math.max(0, goal.targetAmount - current);
  const reached = current >= goal.targetAmount;
  const ratio = goal.targetAmount <= 0
    ? 1
    : Math.min(1, Math.max(0, current / goal.targetAmount));

  return {
    goal,
    current,
    remaining,
    ratio,
    reached,
  };
}
