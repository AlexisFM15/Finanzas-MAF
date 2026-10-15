import React from 'react';
import type { YearMonth, CurrencyCode, BudgetProgress } from '@/domain/models';
import { addMonthsToYearMonth } from '@/domain/dates';
import { formatMoney } from '@/domain/money';

export interface BudgetsSummaryBarProps {
  month: YearMonth;
  onMonthChange: (month: YearMonth) => void;
  budgetsProgress: readonly BudgetProgress[];
  currency?: CurrencyCode | undefined;
}

function formatMonthLabel(month: YearMonth): string {
  const parts = month.split('-');
  const y = Number.parseInt(parts[0] ?? '2026', 10);
  const m = Number.parseInt(parts[1] ?? '1', 10);
  const date = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
}

export const BudgetsSummaryBar: React.FC<BudgetsSummaryBarProps> = ({
  month,
  onMonthChange,
  budgetsProgress,
  currency = 'DOP',
}) => {
  const totalLimit = budgetsProgress.reduce((acc, bp) => acc + bp.budget.monthlyLimit, 0);
  const totalSpent = budgetsProgress.reduce((acc, bp) => acc + bp.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  const warningCount = budgetsProgress.filter((bp) => bp.status === 'warning').length;
  const overCount = budgetsProgress.filter((bp) => bp.status === 'over').length;
  const alertCount = warningCount + overCount;

  const monthLabel = formatMonthLabel(month);

  const handlePrev = () => {
    onMonthChange(addMonthsToYearMonth(month, -1));
  };

  const handleNext = () => {
    onMonthChange(addMonthsToYearMonth(month, 1));
  };

  return (
    <div className="flex flex-col gap-4 bg-[var(--stitch-surface-container-low,#1e1e24)] p-4 sm:p-5 rounded-2xl border border-[var(--stitch-outline-variant,#2c2c34)] shadow-sm">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Mes anterior"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
        >
          <span className="material-symbols-outlined text-xl">chevron_left</span>
          <span className="hidden sm:inline ml-1 text-sm font-medium">Anterior</span>
        </button>

        <h2 className="text-lg sm:text-xl font-bold capitalize text-[var(--stitch-on-surface,#e4e1e6)] tracking-wide">
          {monthLabel}
        </h2>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Mes siguiente"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
        >
          <span className="hidden sm:inline mr-1 text-sm font-medium">Siguiente</span>
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--stitch-surface-container,#23232a)] p-3.5 rounded-xl border border-[var(--stitch-outline-variant,#33323c)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--stitch-on-surface-variant,#c7c5d0)]">
            Total Presupuestado
          </span>
          <span className="text-base sm:text-lg font-bold text-[var(--stitch-on-surface,#e4e1e6)] mt-1">
            {formatMoney(totalLimit, currency)}
          </span>
        </div>

        <div className="bg-[var(--stitch-surface-container,#23232a)] p-3.5 rounded-xl border border-[var(--stitch-outline-variant,#33323c)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--stitch-on-surface-variant,#c7c5d0)]">
            Total Gastado
          </span>
          <span className="text-base sm:text-lg font-bold text-[var(--stitch-on-surface,#e4e1e6)] mt-1">
            {formatMoney(totalSpent, currency)}
          </span>
        </div>

        <div className="bg-[var(--stitch-surface-container,#23232a)] p-3.5 rounded-xl border border-[var(--stitch-outline-variant,#33323c)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--stitch-on-surface-variant,#c7c5d0)]">
            Restante
          </span>
          <span
            className={`text-base sm:text-lg font-bold mt-1 ${
              totalRemaining < 0
                ? 'text-[var(--stitch-error,#ffb4ab)]'
                : 'text-[var(--stitch-primary,#d0bcff)]'
            }`}
          >
            {formatMoney(totalRemaining, currency)}
          </span>
        </div>

        <div className="bg-[var(--stitch-surface-container,#23232a)] p-3.5 rounded-xl border border-[var(--stitch-outline-variant,#33323c)] flex flex-col justify-between">
          <span className="text-xs font-medium text-[var(--stitch-on-surface-variant,#c7c5d0)]">
            Alertas
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-base sm:text-lg font-bold ${
                alertCount > 0
                  ? 'text-[var(--stitch-error,#ffb4ab)]'
                  : 'text-[var(--stitch-on-surface-variant,#c7c5d0)]'
              }`}
            >
              {alertCount}
            </span>
            {alertCount > 0 && (
              <span className="material-symbols-outlined text-sm text-[var(--stitch-error,#ffb4ab)]">
                warning
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
