import React, { useState, useEffect } from 'react';
import type { Budget, Category, YearMonth } from '@/domain/models';
import type { CreateBudgetDTO, UpdateBudgetDTO } from '@/data/repository';
import { parseMoney } from '@/domain/money';

export interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: readonly Category[];
  existingBudgets: readonly Budget[];
  budgetToEdit?: Budget | null | undefined;
  defaultMonth?: YearMonth | undefined;
  onSubmit: (dto: CreateBudgetDTO | UpdateBudgetDTO) => Promise<void>;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingBudgets,
  budgetToEdit,
  defaultMonth,
  onSubmit,
}) => {
  const isEditing = !!budgetToEdit;

  const expenseCategories = categories.filter((c) => c.kind === 'expense');

  const [categoryId, setCategoryId] = useState<string>('');
  const [limitStr, setLimitStr] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(0.8);
  const [startMonth, setStartMonth] = useState<YearMonth>('2026-04');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setLimitStr((budgetToEdit.monthlyLimit / 100).toFixed(2));
      setAlertThreshold(budgetToEdit.alertThreshold);
      setStartMonth(budgetToEdit.startMonth);
      setError(null);
    } else {
      const availableCat = expenseCategories.find(
        (c) => !existingBudgets.some((b) => b.categoryId === c.id),
      ) ?? expenseCategories[0];
      setCategoryId(availableCat?.id ?? '');
      setLimitStr('');
      setAlertThreshold(0.8);
      setStartMonth(defaultMonth ?? '2026-04');
      setError(null);
    }
  }, [budgetToEdit, isOpen, defaultMonth]);

  if (!isOpen) return null;

function sanitizeMoneyInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes(',') && trimmed.includes('.')) {
    const lastComma = trimmed.lastIndexOf(',');
    const lastDot = trimmed.lastIndexOf('.');
    if (lastComma > lastDot) {
      return trimmed.replace(/\./g, '');
    } else {
      return trimmed.replace(/,/g, '');
    }
  }
  return trimmed;
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Debes seleccionar una categoría.');
      return;
    }

    // Check if category is already budgeted (when creating)
    if (!isEditing && existingBudgets.some((b) => b.categoryId === categoryId)) {
      setError('Ya existe un presupuesto para esta categoría.');
      return;
    }

    let parsedLimit = 0;
    try {
      parsedLimit = parseMoney(sanitizeMoneyInput(limitStr), 'DOP');
    } catch {
      setError('Ingresa un monto válido.');
      return;
    }

    if (parsedLimit <= 0) {
      setError('El límite mensual debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && budgetToEdit) {
        const dto: UpdateBudgetDTO = {
          categoryId,
          monthlyLimit: parsedLimit,
          alertThreshold,
          startMonth,
        };
        await onSubmit(dto);
      } else {
        const dto: CreateBudgetDTO = {
          categoryId,
          monthlyLimit: parsedLimit,
          alertThreshold,
          startMonth,
        };
        await onSubmit(dto);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[var(--stitch-surface-container-high,#2b2a30)] border border-[var(--stitch-outline-variant,#33323c)] rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--stitch-outline-variant,#33323c)]/60">
          <h2
            id="budget-modal-title"
            className="text-xl font-bold text-[var(--stitch-on-surface,#e4e1e6)]"
          >
            {isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)] hover:bg-[var(--stitch-surface-container-highest,#36343b)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--stitch-error-container,#93000a)]/50 border border-[var(--stitch-error,#ffb4ab)]/40 text-[var(--stitch-error,#ffb4ab)] text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Categoría */}
          <div>
            <label
              htmlFor="budget-category"
              className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
            >
              Categoría
            </label>
            <select
              id="budget-category"
              aria-label="Categoría"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Límite Mensual */}
          <div>
            <label
              htmlFor="budget-limit"
              className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
            >
              Límite Mensual (DOP)
            </label>
            <div className="relative">
              <input
                id="budget-limit"
                aria-label="Límite mensual"
                type="text"
                placeholder="0.00"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
              />
            </div>
          </div>

          {/* Umbral de Alerta */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="budget-threshold"
                className="text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider"
              >
                Umbral de Alerta
              </label>
              <span className="text-sm font-bold text-[var(--stitch-primary,#d0bcff)]">
                {Math.round(alertThreshold * 100)}%
              </span>
            </div>
            <input
              id="budget-threshold"
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number.parseFloat(e.target.value))}
              className="w-full accent-[var(--stitch-primary,#d0bcff)] cursor-pointer"
            />
            <p className="text-[11px] text-[var(--stitch-on-surface-variant,#c7c5d0)] mt-1">
              Te avisaremos con color ámbar cuando alcances este porcentaje de gasto.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--stitch-outline-variant,#33323c)]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)] hover:bg-[var(--stitch-surface-container,#23232a)] transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--stitch-primary,#d0bcff)] text-[var(--stitch-on-primary,#381e72)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--stitch-primary,#d0bcff)] disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
