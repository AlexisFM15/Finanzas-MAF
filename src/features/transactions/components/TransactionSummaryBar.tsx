import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Scale,
} from 'lucide-react';
import { formatMoney, sumCents } from '@/domain/money';
import type { CurrencyCode, Transaction } from '@/domain/models';

export interface TransactionSummaryBarProps {
  transactions: readonly Transaction[];
  currency?: CurrencyCode;
}

export function TransactionSummaryBar({
  transactions,
  currency = 'DOP',
}: TransactionSummaryBarProps) {
  const incomes = transactions.filter((t) => t.type === 'income');
  const expenses = transactions.filter((t) => t.type === 'expense');

  const totalIncome = sumCents(incomes.map((t) => t.amount));
  const totalExpense = sumCents(expenses.map((t) => t.amount));
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-space-xs rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md shadow-sm">
      <div className="flex items-center justify-between pb-1">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Resumen del periodo
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
          <Receipt className="h-3.5 w-3.5 text-secondary" />
          <span>
            {transactions.length}{' '}
            {transactions.length === 1 ? 'transacción' : 'transacciones'}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {/* Total Ingresos */}
        <div className="flex items-center gap-3 rounded-xl border border-surface-variant/30 bg-surface-container/60 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ArrowDownLeft className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-on-surface-variant">Ingresos</div>
            <div className="font-headline text-base font-semibold text-primary truncate">
              {formatMoney(totalIncome, currency)}
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="flex items-center gap-3 rounded-xl border border-surface-variant/30 bg-surface-container/60 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
            <ArrowUpRight className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-on-surface-variant">Gastos</div>
            <div className="font-headline text-base font-semibold text-error truncate">
              {formatMoney(totalExpense, currency)}
            </div>
          </div>
        </div>

        {/* Balance Neto */}
        <div className="flex items-center gap-3 rounded-xl border border-surface-variant/30 bg-surface-container/60 p-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              netBalance >= 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
            }`}
          >
            <Scale className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-on-surface-variant">
              Balance Neto
            </div>
            <div
              className={`font-headline text-base font-semibold truncate ${
                netBalance >= 0 ? 'text-primary' : 'text-error'
              }`}
            >
              {formatMoney(netBalance, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
