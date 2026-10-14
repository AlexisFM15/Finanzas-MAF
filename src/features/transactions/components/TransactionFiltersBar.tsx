import {
  Calendar,
  Filter,
  RotateCcw,
  Search,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import type { TransactionFilter } from '@/domain/filters';
import type { Account, Category, TransactionType } from '@/domain/models';

export interface TransactionFiltersBarProps {
  filter: TransactionFilter;
  accounts: readonly Account[];
  categories: readonly Category[];
  onFilterChange: (partial: Partial<TransactionFilter>) => void;
  onResetFilter: () => void;
}

const TYPE_TABS: Array<{ label: string; value: TransactionType | 'all' }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' },
  { label: 'Transferencias', value: 'transfer' },
];

export function TransactionFiltersBar({
  filter,
  accounts,
  categories,
  onFilterChange,
  onResetFilter,
}: TransactionFiltersBarProps) {
  const currentType =
    filter.types && filter.types.length === 1 ? filter.types[0] : 'all';

  const hasActiveFilters = Boolean(
    filter.search ||
      (filter.types && filter.types.length > 0) ||
      (filter.accountIds && filter.accountIds.length > 0) ||
      (filter.categoryIds && filter.categoryIds.length > 0) ||
      filter.dateFrom ||
      filter.dateTo,
  );

  const handleTypeSelect = (typeVal: TransactionType | 'all') => {
    if (typeVal === 'all') {
      onFilterChange({ types: undefined });
    } else {
      onFilterChange({ types: [typeVal] });
    }
  };

  return (
    <div className="flex flex-col gap-space-sm rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md shadow-sm">
      {/* Fila 1: Pestañas de tipo rápido y botón reset */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div
          role="tablist"
          aria-label="Filtrar por tipo de transacción"
          className="flex flex-wrap items-center gap-1 rounded-xl border border-surface-variant/30 bg-surface-container p-1 text-xs"
        >
          {TYPE_TABS.map((tab) => {
            const isSelected = currentType === tab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleTypeSelect(tab.value)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                  isSelected
                    ? 'bg-surface-container-high text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilter}
            className="flex items-center gap-1.5 rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-surface-variant"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Fila 2: Búsqueda, Selectores de cuenta, categoría y fechas */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={filter.search ?? ''}
            onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
            placeholder="Buscar transacciones..."
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container py-2 pl-8.5 pr-8 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
          />
          {filter.search && (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              onClick={() => onFilterChange({ search: undefined })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Cuenta */}
        <div className="relative">
          <select
            value={filter.accountIds?.[0] ?? ''}
            onChange={(e) =>
              onFilterChange({
                accountIds: e.target.value ? [e.target.value] : undefined,
              })
            }
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div className="relative">
          <select
            value={filter.categoryIds?.[0] ?? ''}
            onChange={(e) =>
              onFilterChange({
                categoryIds: e.target.value ? [e.target.value] : undefined,
              })
            }
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.kind === 'income' ? 'Ingreso' : 'Gasto'})
              </option>
            ))}
          </select>
        </div>

        {/* Rango de Fechas */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filter.dateFrom ?? ''}
            onChange={(e) =>
              onFilterChange({ dateFrom: e.target.value || undefined })
            }
            title="Fecha desde"
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-2.5 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
          />
          <span className="text-on-surface-variant text-xs">-</span>
          <input
            type="date"
            value={filter.dateTo ?? ''}
            onChange={(e) => onFilterChange({ dateTo: e.target.value || undefined })}
            title="Fecha hasta"
            className="w-full rounded-xl border border-surface-variant/40 bg-surface-container px-2.5 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
