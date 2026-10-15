import type { Account, CurrencyCode, Transaction } from '@/domain/models';
import { netWorthByCurrency } from '@/domain/balances';
import { formatMoney } from '@/domain/money';
import { TrendingUp } from 'lucide-react';

export interface HeroNetWorthCardProps {
  accounts: readonly Account[];
  transactions: readonly Transaction[];
  isLoading?: boolean | undefined;
}

export function HeroNetWorthCard({
  accounts,
  transactions,
  isLoading,
}: HeroNetWorthCardProps) {
  const netWorthMap = netWorthByCurrency(accounts, transactions);
  const mainCurrency: CurrencyCode = 'DOP';
  const dopTotal = netWorthMap.get(mainCurrency) ?? 0;

  // Otras monedas si existieran
  const otherCurrencies: Array<{ currency: CurrencyCode; amount: number }> = [];
  netWorthMap.forEach((amount, currency) => {
    if (currency !== mainCurrency) {
      otherCurrencies.push({ currency, amount });
    }
  });

  return (
    <section
      id="hero-wealth-card"
      className="relative overflow-hidden rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-xl"
      aria-label="Resumen de patrimonio neto"
    >
      {/* Ambient Glass & Aura Accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-12 h-44 w-44 rounded-full bg-secondary/10 blur-2xl"
      />

      <div className="relative z-10 flex flex-col space-y-space-md">
        {/* Micro Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="flex h-2 w-2 animate-ping rounded-full bg-primary" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Net Portfolio Worth
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-primary text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+8.2% MoM</span>
          </div>
        </div>

        {/* Main Balance Display */}
        {isLoading ? (
          <div
            data-testid="hero-net-worth-skeleton"
            className="flex flex-col space-y-2 py-2 animate-pulse"
          >
            <div className="h-9 w-48 rounded bg-surface-variant/50" />
            <div className="h-4 w-32 rounded bg-surface-variant/30" />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-lg-mobile sm:font-headline-lg text-headline-lg-mobile sm:text-headline-lg font-bold tracking-tight text-on-surface">
                {`$${(dopTotal / 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              </span>
              <span className="font-label-md text-label-md font-medium text-on-surface-variant">
                {mainCurrency}
              </span>
            </div>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Calculado en tiempo real a través de {accounts.length}{' '}
              {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
            </p>
          </div>
        )}

        {/* Multi-currency breakdown pills if existing */}
        {otherCurrencies.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-surface-variant/30">
            {otherCurrencies.map((item) => (
              <span
                key={item.currency}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant"
              >
                <span>{item.currency}:</span>
                <span className="font-semibold text-on-surface">
                  {formatMoney(item.amount, item.currency)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
