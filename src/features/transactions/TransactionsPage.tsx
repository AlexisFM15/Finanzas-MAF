import {
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TransactionFiltersBar } from './components/TransactionFiltersBar';
import { TransactionFormModal } from './components/TransactionFormModal';
import { TransactionItem } from './components/TransactionItem';
import { TransactionSummaryBar } from './components/TransactionSummaryBar';
import type {
  AppRepository,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '@/data/repository';
import type { Account, Category, ISODate, Transaction } from '@/domain/models';
import { useTransactionsStore } from '@/state/useTransactionsStore';

export interface TransactionsPageProps {
  repo?: AppRepository;
}

/** Formatea una fecha ISO a encabezado legible en español (ej. 'Hoy', 'Ayer' o '15 de febrero de 2026') */
function formatDateHeader(isoDate: ISODate): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  if (isoDate === today) return 'Hoy';
  if (isoDate === yesterday) return 'Ayer';

  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    const dateObj = new Date(year!, month! - 1, day!);
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return isoDate;
  }
}

export function TransactionsPage({ repo }: TransactionsPageProps) {
  const {
    transactions,
    accounts,
    categories,
    isLoading,
    filter,
    sort,
    loadData,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilter,
    resetFilter,
    setSort,
    getFilteredTransactions,
  } = useTransactionsStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData(repo);
  }, [repo, loadData]);

  // Cuentas y Categorías indexadas para búsqueda O(1)
  const accountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  // Transacciones filtradas y ordenadas
  const filteredTransactions = useMemo(() => {
    return getFilteredTransactions();
  }, [transactions, filter, sort, getFilteredTransactions]);

  // Agrupación por fechas para lectura clara
  const groupedByDate = useMemo(() => {
    const groups: Array<{ date: ISODate; label: string; items: Transaction[] }> = [];
    const dateMap = new Map<ISODate, Transaction[]>();

    for (const tx of filteredTransactions) {
      const list = dateMap.get(tx.date);
      if (list) {
        list.push(tx);
      } else {
        dateMap.set(tx.date, [tx]);
      }
    }

    for (const [date, items] of dateMap.entries()) {
      groups.push({
        date,
        label: formatDateHeader(date),
        items,
      });
    }

    return groups;
  }, [filteredTransactions]);

  // Manejadores
  const handleOpenCreate = () => {
    setTransactionToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (dto: CreateTransactionDTO | UpdateTransactionDTO) => {
    if (transactionToEdit) {
      await updateTransaction(transactionToEdit.id, dto as UpdateTransactionDTO, repo);
    } else {
      await createTransaction(dto as CreateTransactionDTO, repo);
    }
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    await deleteTransaction(transactionToDelete.id, repo);
    setTransactionToDelete(null);
  };

  const toggleSortDirection = () => {
    setSort({
      by: sort.by,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-gutter pb-space-xl">
      {/* Barra superior con título y botón de acción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex items-center gap-space-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline text-headline-sm sm:text-headline-md font-bold text-on-surface">
              Transacciones
            </h1>
            <p className="text-xs text-on-surface-variant">
              Registro, filtros avanzados y autocategorización de movimientos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSortDirection}
            title={`Ordenar por fecha (${sort.direction === 'asc' ? 'ascendente' : 'descendente'})`}
            aria-label={`Ordenar por fecha ${sort.direction}`}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-surface-variant/40 bg-surface-container-low px-3 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">
              {sort.direction === 'asc' ? 'Más antiguas' : 'Más recientes'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => loadData(repo)}
            title="Recargar datos"
            aria-label="Recargar datos"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-variant/40 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-fixed"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva transacción</span>
          </button>
        </div>
      </div>

      {/* Resumen del periodo filtrado */}
      <TransactionSummaryBar transactions={filteredTransactions} />

      {/* Barra de filtros avanzados */}
      <TransactionFiltersBar
        filter={filter}
        accounts={accounts}
        categories={categories}
        onFilterChange={setFilter}
        onResetFilter={resetFilter}
      />

      {/* Lista agrupada de transacciones */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-variant/50 bg-surface-container-low py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-variant/40 text-on-surface-variant mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="font-headline text-base font-semibold text-on-surface">
            No se encontraron transacciones
          </h3>
          <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
            {transactions.length === 0
              ? 'No tienes transacciones registradas. Comienza agregando tu primer movimiento.'
              : 'No hay transacciones que coincidan con los filtros seleccionados.'}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {transactions.length > 0 && (
              <button
                type="button"
                onClick={resetFilter}
                className="rounded-xl border border-surface-variant bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-variant"
              >
                Limpiar filtros
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-fixed"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva transacción</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-space-md">
          {groupedByDate.map((group) => (
            <div key={group.date} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {group.label}
                </span>
                <span className="text-[11px] text-on-surface-variant/70 font-mono">
                  {group.date}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    account={accountsMap.get(tx.accountId)}
                    toAccount={tx.toAccountId ? accountsMap.get(tx.toAccountId) : undefined}
                    category={tx.categoryId ? categoriesMap.get(tx.categoryId) : undefined}
                    onEdit={handleOpenEdit}
                    onDelete={(item) => setTransactionToDelete(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        accounts={accounts}
        categories={categories}
        transactionToEdit={transactionToEdit}
        onSubmit={handleFormSubmit}
      />

      {/* Modal de Confirmación de Eliminación */}
      {transactionToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setTransactionToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-error/30 bg-surface-container p-space-md shadow-2xl">
            <div className="flex items-center gap-space-xs text-error mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-headline text-base font-semibold text-on-surface">
                Eliminar transacción
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              ¿Estás seguro de que deseas eliminar permanentemente{' '}
              <strong className="text-on-surface">
                {transactionToDelete.description}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-variant"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-error px-4 py-1.5 text-xs font-bold text-on-error hover:bg-error-container"
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
