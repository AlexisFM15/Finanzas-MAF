import { ArrowDownRight, ArrowUpRight, Coins, TrendingUp } from 'lucide-react';
import { formatMoney } from '@/domain/money';
import type { Account, Cents, CurrencyCode, ID } from '@/domain/models';

export interface AccountsSummaryProps {
  accounts: readonly Account[];
  balances: ReadonlyMap<ID, Cents>;
}

interface CurrencyTotals {
  assets: Cents;
  liabilities: Cents;
  netWorth: Cents;
}

export function AccountsSummary({ accounts, balances }: AccountsSummaryProps) {
  // Agrupar por divisa
  const totalsByCurrency = new Map<CurrencyCode, CurrencyTotals>();

  for (const acc of accounts) {
    const bal = balances.get(acc.id) ?? acc.openingBalance;
    const current = totalsByCurrency.get(acc.currency) ?? {
      assets: 0,
      liabilities: 0,
      netWorth: 0,
    };

    if (bal > 0) {
      current.assets += bal;
    } else if (bal < 0) {
      current.liabilities += Math.abs(bal);
    }
    current.netWorth += bal;

    totalsByCurrency.set(acc.currency, current);
  }

  // Divisa principal: DOP por defecto si existe, o primera divisa, o DOP fallback
  const primaryCurrency: CurrencyCode = totalsByCurrency.has('DOP')
    ? 'DOP'
    : (totalsByCurrency.keys().next().value ?? 'DOP');

  const primaryTotals = totalsByCurrency.get(primaryCurrency) ?? {
    assets: 0,
    liabilities: 0,
    netWorth: 0,
  };

  const secondaryCurrencies = Array.from(totalsByCurrency.entries()).filter(
    ([curr]) => curr !== primaryCurrency,
  );

  return (
    <div className="flex flex-col gap-space-sm">
      {/* Tarjetas métricas principales */}
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-3">
        {/* Patrimonio Neto */}
        <div className="flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Patrimonio Neto
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline-md text-headline-md font-semibold text-on-surface">
              {formatMoney(primaryTotals.netWorth, primaryCurrency)}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {primaryCurrency} Total consolidado
            </span>
          </div>
        </div>

        {/* Activos Totales */}
        <div className="flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Activos Totales
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline-md text-headline-md font-semibold text-primary">
              {formatMoney(primaryTotals.assets, primaryCurrency)}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Cuentas, ahorros y efectivo
            </span>
          </div>
        </div>

        {/* Deuda Total / Pasivos */}
        <div className="flex flex-col justify-between rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md shadow-sm transition-all hover:border-error/40">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Deuda Total
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-error/10 text-error">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline-md text-headline-md font-semibold text-error">
              {formatMoney(primaryTotals.liabilities, primaryCurrency)}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Tarjetas y préstamos
            </span>
          </div>
        </div>
      </div>

      {/* Desglose multi-divisa si existen divisas secundarias */}
      {secondaryCurrencies.length > 0 && (
        <div className="flex flex-wrap items-center gap-space-xs rounded-xl border border-surface-variant/30 bg-surface-container/60 px-space-md py-space-xs text-xs text-on-surface-variant">
          <Coins className="h-3.5 w-3.5 text-secondary" />
          <span className="font-semibold text-on-surface">Otras divisas:</span>
          {secondaryCurrencies.map(([curr, totals]) => (
            <span
              key={curr}
              className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 font-medium text-on-surface"
            >
              <span className="text-secondary">{curr}:</span>
              <span>{formatMoney(totals.netWorth, curr)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
