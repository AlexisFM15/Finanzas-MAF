import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Category, Transaction } from '@/domain/models';

export interface CategoryExpenseDonutChartProps {
  transactions: readonly Transaction[];
  categories: readonly Category[];
  isLoading?: boolean | undefined;
}

interface DonutItem {
  name: string;
  value: number;
  color: string;
  percent: number;
}

interface CustomTooltipProps {
  active?: boolean | undefined;
  payload?: Array<{ payload: DonutItem }> | undefined;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-surface-variant/50 bg-surface-container-highest p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <p className="text-xs font-semibold text-on-surface">{data.name}</p>
      </div>
      <p className="text-xs text-on-surface-variant">
        ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (
        {data.percent.toFixed(1)}%)
      </p>
    </div>
  );
}

export function CategoryExpenseDonutChart({
  transactions,
  categories,
  isLoading,
}: CategoryExpenseDonutChartProps) {
  if (isLoading) {
    return (
      <div
        data-testid="category-donut-chart-skeleton"
        className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm animate-pulse"
      >
        <div className="h-5 w-44 rounded bg-surface-variant/40 mb-2" />
        <div className="h-4 w-28 rounded bg-surface-variant/30 mb-6" />
        <div className="h-48 w-full rounded-xl bg-surface-variant/20" />
      </div>
    );
  }

  const { items, totalExpense } = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const totalsByCat = new Map<string, number>();
    let total = 0;

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const catId = tx.categoryId ?? 'uncategorized';
      const prev = totalsByCat.get(catId) ?? 0;
      totalsByCat.set(catId, prev + tx.amount);
      total += tx.amount;
    }

    const list: DonutItem[] = [];
    totalsByCat.forEach((amountInCents, catId) => {
      const cat = categoryMap.get(catId);
      const name = cat?.name ?? 'Sin Categoría';
      const color = cat?.color ?? '#8e9099';
      const value = amountInCents / 100;
      const percent = total > 0 ? (amountInCents / total) * 100 : 0;
      list.push({ name, value, color, percent });
    });

    list.sort((a, b) => b.value - a.value);

    return { items: list, totalExpense: total / 100 };
  }, [transactions, categories]);

  if (items.length === 0 || totalExpense === 0) {
    return (
      <div className="flex flex-col rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm">
        <h2 className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface mb-1">
          Gastos por Categoría
        </h2>
        <p className="font-body-sm text-xs text-on-surface-variant mb-6">
          Distribución de consumos recientes
        </p>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Sin gastos registrados en este período
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface">
          Gastos por Categoría
        </h2>
        <p className="font-body-sm text-xs text-on-surface-variant">
          Total: ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Donut Chart */}
        <div className="h-48 w-full min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={180}>
            <PieChart>
              <Pie
                data={items}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {items.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend List */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {items.slice(0, 5).map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface-container/50 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-on-surface font-medium">
                  {item.name}
                </span>
              </div>
              <span className="shrink-0 font-semibold text-on-surface-variant ml-2">
                {item.percent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
