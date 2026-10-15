import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import type { Account, Category, Transaction, TransactionType } from '@/domain/models';

export interface RecentTransactionsWidgetProps {
  transactions: readonly Transaction[];
  accounts: readonly Account[];
  categories: readonly Category[];
  isLoading?: boolean | undefined;
}

type TabType = 'all' | 'income' | 'expense';

export function RecentTransactionsWidget({
  transactions,
  categories,
  isLoading,
}: RecentTransactionsWidgetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (activeTab !== 'all') {
      list = list.filter((tx) => tx.type === activeTab);
    }
    list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
    return list.slice(0, 5);
  }, [transactions, activeTab]);

  if (isLoading) {
    return (
      <div
        data-testid="recent-transactions-skeleton"
        className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm animate-pulse"
      >
        <div className="h-5 w-44 rounded bg-surface-variant/40 mb-4" />
        <div className="space-y-3">
          <div className="h-14 w-full rounded-xl bg-surface-variant/20" />
          <div className="h-14 w-full rounded-xl bg-surface-variant/20" />
          <div className="h-14 w-full rounded-xl bg-surface-variant/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface">
            Movimientos Recientes
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Tus últimas operaciones registradas
          </p>
        </div>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline group"
        >
          <span>Ver todas</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filtro de transacciones recientes"
        className="flex items-center gap-1 rounded-xl bg-surface-container p-1 mb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'income'}
          onClick={() => setActiveTab('income')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
            activeTab === 'income'
              ? 'bg-primary/20 text-primary font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Incomes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'expense'}
          onClick={() => setActiveTab('expense')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
            activeTab === 'expense'
              ? 'bg-error/20 text-error font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs sm:text-sm text-on-surface-variant">
            No hay movimientos recientes en esta categoría
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-surface-variant/30">
          {filtered.map((tx) => {
            const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
            const isIncome = tx.type === 'income';
            const isExpense = tx.type === 'expense';
            const sign = isIncome ? '+' : isExpense ? '-' : '';
            const amountFormatted = `${sign}$${(tx.amount / 100).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}`;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 hover:bg-surface-container/30 px-2 rounded-xl transition-colors"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      isIncome
                        ? 'bg-primary/15 text-primary border-primary/20'
                        : isExpense
                          ? 'bg-surface-variant text-on-surface border-surface-variant/50'
                          : 'bg-secondary/15 text-secondary border-secondary/20'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : isExpense ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowLeftRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs sm:text-sm font-semibold text-on-surface">
                      {tx.description}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      {cat && (
                        <span
                          className="font-medium"
                          style={{ color: cat.color }}
                        >
                          {cat.name} •
                        </span>
                      )}
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`text-xs sm:text-sm font-bold font-mono ${
                      isIncome
                        ? 'text-primary'
                        : isExpense
                          ? 'text-error'
                          : 'text-on-surface'
                    }`}
                  >
                    {amountFormatted}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
