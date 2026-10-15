import React from 'react';
import type { Account, CurrencyCode, Goal } from '@/domain/models';
import type { GoalProgress } from '@/domain/budgets';
import { formatMoney } from '@/domain/money';

export interface GoalCardProps {
  progress: GoalProgress;
  linkedAccount?: Account | undefined;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  currency?: CurrencyCode | undefined;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  progress,
  linkedAccount,
  onEdit,
  onDelete,
  currency = 'DOP',
}) => {
  const { goal, current, remaining, ratio, reached } = progress;
  const percentage = Math.round(ratio * 100);
  const barWidth = Math.min(percentage, 100);

  return (
    <div className="bg-[var(--stitch-surface-container,#23232a)] p-4 sm:p-5 rounded-2xl border border-[var(--stitch-outline-variant,#33323c)] shadow-sm hover:border-[var(--stitch-outline,#49454f)] transition-colors flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--stitch-secondary-container,#334b4f)]/50 border border-[var(--stitch-secondary,#4cd7f6)]/30 flex items-center justify-center text-[var(--stitch-secondary,#4cd7f6)]">
            <span className="material-symbols-outlined text-xl">savings</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--stitch-on-surface,#e4e1e6)]">
              {goal.name}
            </h3>
            {goal.deadline && (
              <span className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-xs">event</span>
                Meta: {goal.deadline}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {reached ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
            <span className="material-symbols-outlined text-xs">verified</span>
            Alcanzada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--stitch-primary-container,#4f378b)]/40 text-[var(--stitch-primary,#d0bcff)] border border-[var(--stitch-primary,#d0bcff)]/30">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            En progreso
          </span>
        )}
      </div>

      {/* Progress & Amounts */}
      <div>
        <div className="flex items-baseline justify-between text-sm mb-1.5">
          <span className="font-bold text-lg text-[var(--stitch-on-surface,#e4e1e6)]">
            {percentage}%
          </span>
          <span className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)]">
            {formatMoney(current, currency)} de {formatMoney(goal.targetAmount, currency)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[var(--stitch-surface-container-high,#2b2a30)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              reached ? 'bg-emerald-400' : 'bg-[var(--stitch-secondary,#4cd7f6)]'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Detail indicators */}
        <div className="mt-2 text-xs flex items-center justify-between text-[var(--stitch-on-surface-variant,#c7c5d0)]">
          <span>
            {reached ? 'Meta lograda con éxito' : `Faltan: ${formatMoney(remaining, currency)}`}
          </span>

          {linkedAccount ? (
            <span className="flex items-center gap-1 text-[var(--stitch-secondary,#4cd7f6)]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: linkedAccount.color }}
              />
              {linkedAccount.name}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--stitch-on-surface-variant,#c7c5d0)]/80">
              Saldo manual
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--stitch-outline-variant,#33323c)]/50">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label="Editar meta"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-primary,#d0bcff)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
        >
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          aria-label="Eliminar meta"
          className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-error,#ffb4ab)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-error,#ffb4ab)]"
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>
    </div>
  );
};
