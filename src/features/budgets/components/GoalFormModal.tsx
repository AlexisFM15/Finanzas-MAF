import React, { useState, useEffect } from 'react';
import type { Account, Goal } from '@/domain/models';
import type { CreateGoalDTO, UpdateGoalDTO } from '@/data/repository';
import { parseMoney } from '@/domain/money';

export interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: readonly Account[];
  goalToEdit?: Goal | null | undefined;
  onSubmit: (dto: CreateGoalDTO | UpdateGoalDTO) => Promise<void>;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  accounts,
  goalToEdit,
  onSubmit,
}) => {
  const isEditing = !!goalToEdit;

  const [name, setName] = useState<string>('');
  const [targetStr, setTargetStr] = useState<string>('');
  const [linkedAccountId, setLinkedAccountId] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [manualCurrentStr, setManualCurrentStr] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetStr((goalToEdit.targetAmount / 100).toFixed(2));
      setLinkedAccountId(goalToEdit.linkedAccountId ?? '');
      setDeadline(goalToEdit.deadline ?? '');
      setManualCurrentStr(
        goalToEdit.currentAmount ? (goalToEdit.currentAmount / 100).toFixed(2) : '',
      );
      setError(null);
    } else {
      setName('');
      setTargetStr('');
      setLinkedAccountId('');
      setDeadline('');
      setManualCurrentStr('');
      setError(null);
    }
  }, [goalToEdit, isOpen]);

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

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre de la meta es requerido.');
      return;
    }

    let parsedTarget = 0;
    try {
      parsedTarget = parseMoney(sanitizeMoneyInput(targetStr), 'DOP');
    } catch {
      setError('Ingresa un monto objetivo válido.');
      return;
    }

    if (parsedTarget <= 0) {
      setError('El monto objetivo debe ser mayor a 0.');
      return;
    }

    let parsedManualCurrent: number | undefined;
    if (!linkedAccountId && manualCurrentStr.trim()) {
      try {
        parsedManualCurrent = parseMoney(sanitizeMoneyInput(manualCurrentStr), 'DOP');
      } catch {
        setError('Ingresa un saldo actual válido.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const baseDto: {
        name: string;
        targetAmount: number;
        linkedAccountId?: string | undefined;
        deadline?: string | undefined;
        currentAmount?: number | undefined;
      } = {
        name: trimmedName,
        targetAmount: parsedTarget,
        ...(linkedAccountId ? { linkedAccountId } : {}),
        ...(deadline ? { deadline } : {}),
        ...(parsedManualCurrent !== undefined ? { currentAmount: parsedManualCurrent } : {}),
      };

      if (isEditing && goalToEdit) {
        const updateDto: UpdateGoalDTO = {
          name: baseDto.name,
          targetAmount: baseDto.targetAmount,
          ...(baseDto.linkedAccountId ? { linkedAccountId: baseDto.linkedAccountId } : {}),
          ...(baseDto.deadline ? { deadline: baseDto.deadline } : {}),
          ...(baseDto.currentAmount !== undefined ? { currentAmount: baseDto.currentAmount } : {}),
        };
        await onSubmit(updateDto);
      } else {
        const createDto: CreateGoalDTO = {
          name: baseDto.name,
          targetAmount: baseDto.targetAmount,
          ...(baseDto.linkedAccountId ? { linkedAccountId: baseDto.linkedAccountId } : {}),
          ...(baseDto.deadline ? { deadline: baseDto.deadline } : {}),
          ...(baseDto.currentAmount !== undefined ? { currentAmount: baseDto.currentAmount } : {}),
        };
        await onSubmit(createDto);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[var(--stitch-surface-container-high,#2b2a30)] border border-[var(--stitch-outline-variant,#33323c)] rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--stitch-outline-variant,#33323c)]/60">
          <h2
            id="goal-modal-title"
            className="text-xl font-bold text-[var(--stitch-on-surface,#e4e1e6)]"
          >
            {isEditing ? 'Editar Meta' : 'Nueva Meta'}
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
          {/* Nombre de la meta */}
          <div>
            <label
              htmlFor="goal-name"
              className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
            >
              Nombre de la Meta
            </label>
            <input
              id="goal-name"
              aria-label="Nombre de la meta"
              type="text"
              placeholder="p. ej. Fondo de Emergencia, Vacaciones"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
            />
          </div>

          {/* Monto Objetivo */}
          <div>
            <label
              htmlFor="goal-target"
              className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
            >
              Monto Objetivo (DOP)
            </label>
            <input
              id="goal-target"
              aria-label="Monto objetivo"
              type="text"
              placeholder="0.00"
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
            />
          </div>

          {/* Cuenta vinculada */}
          <div>
            <label
              htmlFor="goal-account"
              className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
            >
              Cuenta Vinculada (Sincronización Automática)
            </label>
            <select
              id="goal-account"
              aria-label="Cuenta vinculada"
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
            >
              <option value="">Ninguna (Saldo manual)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Saldo manual si no hay cuenta vinculada */}
          {!linkedAccountId && (
            <div>
              <label
                htmlFor="goal-manual-amount"
                className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
              >
                Monto Ahorrado Actual (DOP)
              </label>
              <input
                id="goal-manual-amount"
                aria-label="Monto ahorrado actual"
                type="text"
                placeholder="0.00"
                value={manualCurrentStr}
                onChange={(e) => setManualCurrentStr(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
              />
            </div>
          )}

          {/* Fecha Límite */}
          <div>
            <label
              htmlFor="goal-deadline"
              className="block text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] uppercase tracking-wider mb-1.5"
            >
              Fecha Límite (Opcional)
            </label>
            <input
              id="goal-deadline"
              aria-label="Fecha límite"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[var(--stitch-surface-container,#23232a)] border border-[var(--stitch-outline-variant,#33323c)] text-[var(--stitch-on-surface,#e4e1e6)] focus:outline-none focus:ring-2 focus:ring-[var(--stitch-primary,#d0bcff)]"
            />
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
              {isSubmitting ? 'Guardando...' : 'Guardar meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
