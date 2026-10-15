import React from 'react';
import type { Budget, BudgetProgress, Category, CurrencyCode } from '@/domain/models';
import { formatMoney } from '@/domain/money';

export interface BudgetCardProps {
  progress: BudgetProgress;
  category?: Category | undefined;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  currency?: CurrencyCode | undefined;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  progress,
  category,
  onEdit,
  onDelete,
  currency = 'DOP',
}) => {
  const { budget, spent, remaining, ratio, status } = progress;
  const percentage = Math.round(ratio * 100);
  const barWidth = Math.min(percentage, 100);

  const statusConfig = {
    safe: {
      label: 'Normal',
      badgeClass: 'bg-[var(--stitch-primary-container,#4f378b)]/40 text-[var(--stitch-primary,#d0bcff)] border border-[var(--stitch-primary,#d0bcff)]/30',
      barColor: 'bg-[var(--stitch-primary,#d0bcff)]',
      icon: 'check_circle',
    },
    warning: {
      label: 'Alerta',
      badgeClass: 'bg-amber-950/60 text-amber-300 border border-amber-600/40',
      barColor: 'bg-amber-400',
      icon: 'warning',
    },
    over: {
      label: 'Excedido',
      badgeClass: 'bg-[var(--stitch-error-container,#93000a)]/60 text-[var(--stitch-error,#ffb4ab)] border border-[var(--stitch-error,#ffb4ab)]/40',
      barColor: 'bg-[var(--stitch-error,#ffb4ab)]',
      icon: 'error',
    },
  }[status];

  return (
    <div className="bg-[var(--stitch-surface-container,#23232a)] p-4 sm:p-5 rounded-2xl border border-[var(--stitch-outline-variant,#33323c)] shadow-sm hover:border-[var(--stitch-outline,#49454f)] transition-colors flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: category?.color ?? '#79747e' }}
          >
            <span className="material-symbols-outlined text-xl">
              {category?.icon ?? 'category'}
            </span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--stitch-on-surface,#e4e1e6)]">
              {category?.name ?? 'Sin categoría'}
            </h3>
            <span className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)]">
              Umbral: {Math.round(budget.alertThreshold * 100)}%
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.badgeClass}`}
        >
          <span className="material-symbols-outlined text-xs">{statusConfig.icon}</span>
          {statusConfig.label}
        </span>
      </div>

      {/* Progress & Amounts */}
      <div>
        <div className="flex items-baseline justify-between text-sm mb-1.5">
          <span className="font-bold text-lg text-[var(--stitch-on-surface,#e4e1e6)]">
            {percentage}%
          </span>
          <span className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)]">
            {formatMoney(spent, currency)} de {formatMoney(budget.monthlyLimit, currency)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[var(--stitch-surface-container-high,#2b2a30)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusConfig.barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        <div className="mt-2 text-xs flex justify-between text-[var(--stitch-on-surface-variant,#c7c5d0)]">
          <span>
            {remaining >= 0 ? 'Disponible:' : 'Exceso:'}{' '}
            <strong
              className={
                remaining < 0
                  ? 'text-[var(--stitch-error,#ffb4ab)]'
                  : 'text-[var(--stitch-on-surface,#e4e1e6)]'
              }
            >
              {formatMoney(Math.abs(remaining), currency)}
            </strong>
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--stitch-outline-variant,#33323c)]/50">
        <button
          type="button"
          onClick={() => onEdit(budget)}
          aria-label="Editar presupuesto"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-primary,#d0bcff)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
        >
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(budget)}
          aria-label="Eliminar presupuesto"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-error,#ffb4ab)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-error,#ffb4ab)]"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>
    </div>
  );
};
