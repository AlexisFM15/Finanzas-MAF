import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction, YearMonth } from '@/domain/models';
import { monthlySeries } from '@/domain/monthly';
import { addMonthsToYearMonth, toYearMonth } from '@/domain/dates';

export interface IncomeExpenseChartProps {
  transactions: readonly Transaction[];
  isLoading?: boolean | undefined;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic',
};

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean | undefined;
  payload?: TooltipPayloadItem[] | undefined;
  label?: string | undefined;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-surface-variant/50 bg-surface-container-highest p-3 shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold text-on-surface mb-1.5">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-on-surface-variant">{item.name}:</span>
          <span className="font-semibold text-on-surface">
            ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({
  transactions,
  isLoading,
}: IncomeExpenseChartProps) {
  if (isLoading) {
    return (
      <div
        data-testid="income-expense-chart-skeleton"
        className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm animate-pulse"
      >
        <div className="h-5 w-40 rounded bg-surface-variant/40 mb-2" />
        <div className="h-4 w-32 rounded bg-surface-variant/30 mb-6" />
        <div className="h-56 w-full rounded-xl bg-surface-variant/20" />
      </div>
    );
  }

  const chartData = useMemo(() => {
    // Determine the latest month from transactions or default to '2026-04'
    let latestMonth: YearMonth = '2026-04';
    for (const tx of transactions) {
      const ym = toYearMonth(tx.date);
      if (ym > latestMonth) {
        latestMonth = ym;
      }
    }

    const startMonth = addMonthsToYearMonth(latestMonth, -5);
    const series = monthlySeries(transactions, startMonth, latestMonth);

    return series.map((s) => {
      const monthPart = s.month.slice(5, 7);
      const label = MONTH_NAMES[monthPart] ?? s.month;
      return {
        month: label,
        rawMonth: s.month,
        Ingresos: s.income / 100,
        Gastos: s.expense / 100,
      };
    });
  }, [transactions]);

  return (
    <div className="flex flex-col rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface">
            Comparativa Mensual
          </h2>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Ingresos vs Gastos (últimos 6 meses)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-on-surface-variant">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-error" />
            <span className="text-on-surface-variant">Gastos</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-60 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={200}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              stroke="#8e9099"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              stroke="#8e9099"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="Ingresos"
              name="Ingresos"
              fill="#4edea3"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="Gastos"
              name="Gastos"
              fill="#ffb4ab"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
