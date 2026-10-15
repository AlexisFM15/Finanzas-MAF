import React, { useEffect, useState } from 'react';
import type { AppRepository, CreateBudgetDTO, CreateGoalDTO, UpdateBudgetDTO, UpdateGoalDTO } from '@/data/repository';
import type { Budget, Goal } from '@/domain/models';
import { useBudgetsStore } from '@/state/useBudgetsStore';
import { BudgetsSummaryBar } from './components/BudgetsSummaryBar';
import { BudgetCard } from './components/BudgetCard';
import { BudgetFormModal } from './components/BudgetFormModal';
import { GoalCard } from './components/GoalCard';
import { GoalFormModal } from './components/GoalFormModal';

export interface BudgetsPageProps {
  repo?: AppRepository | undefined;
}

type TabType = 'budgets' | 'goals';

type DeletionTarget =
  | { type: 'budget'; item: Budget }
  | { type: 'goal'; item: Goal };

export function BudgetsPage({ repo }: BudgetsPageProps) {
  const {
    budgets,
    goals,
    categories,
    accounts,
    selectedMonth,
    setSelectedMonth,
    isLoading,
    loadData,
    createBudget,
    updateBudget,
    deleteBudget,
    createGoal,
    updateGoal,
    deleteGoal,
    getBudgetsProgress,
    getGoalsProgress,
  } = useBudgetsStore();

  const [activeTab, setActiveTab] = useState<TabType>('budgets');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [itemToDelete, setItemToDelete] = useState<DeletionTarget | null>(null);

  useEffect(() => {
    void loadData(repo);
  }, [repo, loadData]);

  const budgetsProgress = getBudgetsProgress(selectedMonth);
  const goalsProgress = getGoalsProgress();

  const categoriesMap = new Map(categories.map((c) => [c.id, c]));
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));

  const handleBudgetSubmit = async (dto: CreateBudgetDTO | UpdateBudgetDTO) => {
    if (budgetToEdit) {
      await updateBudget(budgetToEdit.id, dto, repo);
    } else {
      await createBudget(dto as CreateBudgetDTO, repo);
    }
  };

  const handleGoalSubmit = async (dto: CreateGoalDTO | UpdateGoalDTO) => {
    if (goalToEdit) {
      await updateGoal(goalToEdit.id, dto, repo);
    } else {
      await createGoal(dto as CreateGoalDTO, repo);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'budget') {
      await deleteBudget(itemToDelete.item.id, repo);
    } else {
      await deleteGoal(itemToDelete.item.id, repo);
    }
    setItemToDelete(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--stitch-primary-container,#4f378b)]/30 border border-[var(--stitch-primary,#d0bcff)]/30 text-[var(--stitch-primary,#d0bcff)]">
            <span className="material-symbols-outlined text-2xl">donut_large</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--stitch-on-surface,#e4e1e6)] tracking-tight">
              Presupuestos y Metas
            </h1>
            <p className="text-xs sm:text-sm text-[var(--stitch-on-surface-variant,#c7c5d0)]">
              Límites mensuales y objetivos de ahorro
            </p>
          </div>
        </div>

        {/* Contextual Action Button */}
        {activeTab === 'budgets' ? (
          <button
            type="button"
            onClick={() => {
              setBudgetToEdit(null);
              setIsBudgetModalOpen(true);
            }}
            aria-label="Nuevo presupuesto"
            className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--stitch-primary,#d0bcff)] text-[var(--stitch-on-primary,#381e72)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--stitch-primary,#d0bcff)] shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Nuevo Presupuesto</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setGoalToEdit(null);
              setIsGoalModalOpen(true);
            }}
            aria-label="Nueva meta"
            className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--stitch-primary,#d0bcff)] text-[var(--stitch-on-primary,#381e72)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--stitch-primary,#d0bcff)] shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Nueva Meta</span>
          </button>
        )}
      </div>

      {/* Tabs navigation */}
      <div
        role="tablist"
        aria-label="Vistas de presupuestos y metas"
        className="flex items-center p-1 bg-[var(--stitch-surface-container-low,#1e1e24)] border border-[var(--stitch-outline-variant,#2c2c34)] rounded-2xl w-full sm:w-fit"
      >
        <button
          type="button"
          role="tab"
          id="tab-budgets"
          aria-selected={activeTab === 'budgets'}
          aria-controls="panel-budgets"
          onClick={() => setActiveTab('budgets')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'budgets'
              ? 'bg-[var(--stitch-surface-container-high,#2b2a30)] text-[var(--stitch-primary,#d0bcff)] shadow-sm'
              : 'text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)]'
          }`}
        >
          <span className="material-symbols-outlined text-base">pie_chart</span>
          <span>Presupuestos Mensuales</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-goals"
          aria-selected={activeTab === 'goals'}
          aria-controls="panel-goals"
          onClick={() => setActiveTab('goals')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'goals'
              ? 'bg-[var(--stitch-surface-container-high,#2b2a30)] text-[var(--stitch-primary,#d0bcff)] shadow-sm'
              : 'text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)]'
          }`}
        >
          <span className="material-symbols-outlined text-base">savings</span>
          <span>Metas de Ahorro</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'budgets' && (
        <div id="panel-budgets" role="tabpanel" aria-labelledby="tab-budgets" className="flex flex-col gap-6">
          <BudgetsSummaryBar
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            budgetsProgress={budgetsProgress}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-[var(--stitch-surface-container,#23232a)] animate-pulse border border-[var(--stitch-outline-variant,#33323c)]"
                />
              ))}
            </div>
          ) : budgetsProgress.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--stitch-surface-container-low,#1e1e24)] border border-[var(--stitch-outline-variant,#2c2c34)] flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-[var(--stitch-on-surface-variant,#c7c5d0)]/60 mb-2">
                account_balance_wallet
              </span>
              <h3 className="text-base font-semibold text-[var(--stitch-on-surface,#e4e1e6)]">
                No hay presupuestos para este mes
              </h3>
              <p className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)] mt-1 max-w-sm">
                Define un límite de gasto por categoría para mantener tus finanzas bajo control y recibir alertas automáticas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBudgetToEdit(null);
                  setIsBudgetModalOpen(true);
                }}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--stitch-primary,#d0bcff)] text-[var(--stitch-on-primary,#381e72)]"
              >
                Crear Presupuesto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgetsProgress.map((bp) => (
                <BudgetCard
                  key={bp.budget.id}
                  progress={bp}
                  category={categoriesMap.get(bp.budget.categoryId)}
                  onEdit={(b) => {
                    setBudgetToEdit(b);
                    setIsBudgetModalOpen(true);
                  }}
                  onDelete={(b) => {
                    setItemToDelete({ type: 'budget', item: b });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div id="panel-goals" role="tabpanel" aria-labelledby="tab-goals" className="flex flex-col gap-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-[var(--stitch-surface-container,#23232a)] animate-pulse border border-[var(--stitch-outline-variant,#33323c)]"
                />
              ))}
            </div>
          ) : goalsProgress.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[var(--stitch-surface-container-low,#1e1e24)] border border-[var(--stitch-outline-variant,#2c2c34)] flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-[var(--stitch-on-surface-variant,#c7c5d0)]/60 mb-2">
                savings
              </span>
              <h3 className="text-base font-semibold text-[var(--stitch-on-surface,#e4e1e6)]">
                No tienes metas de ahorro activas
              </h3>
              <p className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)] mt-1 max-w-sm">
                Fíjate objetivos para compras importantes, fondos de emergencia o proyectos especiales, vinculados a tus cuentas bancarias.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--stitch-primary,#d0bcff)] text-[var(--stitch-on-primary,#381e72)]"
              >
                Crear Meta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goalsProgress.map((gp) => (
                <GoalCard
                  key={gp.goal.id}
                  progress={gp}
                  linkedAccount={
                    gp.goal.linkedAccountId ? accountsMap.get(gp.goal.linkedAccountId) : undefined
                  }
                  onEdit={(g) => {
                    setGoalToEdit(g);
                    setIsGoalModalOpen(true);
                  }}
                  onDelete={(g) => {
                    setItemToDelete({ type: 'goal', item: g });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetFormModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetToEdit(null);
        }}
        categories={categories}
        existingBudgets={budgets}
        budgetToEdit={budgetToEdit}
        defaultMonth={selectedMonth}
        onSubmit={handleBudgetSubmit}
      />

      {/* Goal Modal */}
      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        accounts={accounts}
        goalToEdit={goalToEdit}
        onSubmit={handleGoalSubmit}
      />

      {/* Deletion Dialog */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setItemToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--stitch-error,#ffb4ab)]/30 bg-[var(--stitch-surface-container,#23232a)] p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-[var(--stitch-error,#ffb4ab)] mb-3">
              <span className="material-symbols-outlined text-xl">warning</span>
              <h3 className="text-base font-semibold text-[var(--stitch-on-surface,#e4e1e6)]">
                Confirmar Eliminación
              </h3>
            </div>
            <p className="text-xs text-[var(--stitch-on-surface-variant,#c7c5d0)]">
              ¿Estás seguro de que deseas eliminar permanentemente{' '}
              <strong className="text-[var(--stitch-on-surface,#e4e1e6)]">
                {itemToDelete.type === 'budget'
                  ? (categoriesMap.get(itemToDelete.item.categoryId)?.name ?? 'este presupuesto')
                  : itemToDelete.item.name}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-[var(--stitch-on-surface-variant,#c7c5d0)] hover:text-[var(--stitch-on-surface,#e4e1e6)] hover:bg-[var(--stitch-surface-container-high,#2b2a30)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[var(--stitch-error,#ffb4ab)] text-[var(--stitch-on-error,#690005)] hover:opacity-90"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
