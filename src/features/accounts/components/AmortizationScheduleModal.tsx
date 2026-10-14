import { Calendar, FileSpreadsheet, Percent, Timer, TrendingDown, X } from 'lucide-react';
import { useEffect } from 'react';
import { amortizationSchedule, monthlyPayment } from '@/domain/amortization';
import { formatMoney, sumCents } from '@/domain/money';
import type { Account } from '@/domain/models';

export interface AmortizationScheduleModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AmortizationScheduleModal({
  account,
  isOpen,
  onClose,
}: AmortizationScheduleModalProps) {
  // Manejo de tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !account || !account.loan) {
    return null;
  }

  const { loan, currency } = account;
  const payment = monthlyPayment(loan);
  const rows = amortizationSchedule(loan);
  const totalInterest = sumCents(rows.map((r) => r.interest));
  const totalPayment = sumCents(rows.map((r) => r.payment));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="amortization-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-surface-variant/40 bg-surface-container shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 px-space-md py-3.5">
          <div className="flex items-center gap-space-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="amortization-modal-title"
                className="font-headline text-headline-sm font-semibold text-on-surface"
              >
                Cuadro de Amortización
              </h2>
              <p className="text-xs text-on-surface-variant">
                <span>{account.name}</span> • Método francés (cuotas fijas)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumen Métricas */}
        <div className="grid grid-cols-2 gap-space-xs border-b border-surface-variant/30 bg-surface-container-low p-space-md sm:grid-cols-4 sm:gap-space-sm">
          <div className="rounded-xl border border-surface-variant/30 bg-surface-container p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <TrendingDown className="h-3.5 w-3.5 text-primary" />
              <span>Cuota mensual</span>
            </div>
            <div className="mt-1 font-headline text-base font-semibold text-primary">
              {formatMoney(payment, currency)}
            </div>
          </div>

          <div className="rounded-xl border border-surface-variant/30 bg-surface-container p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Percent className="h-3.5 w-3.5 text-secondary" />
              <span>Tasa anual</span>
            </div>
            <div className="mt-1 font-headline text-base font-semibold text-on-surface">
              {(loan.annualRate * 100).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-surface-variant/30 bg-surface-container p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Timer className="h-3.5 w-3.5 text-tertiary" />
              <span>Plazo total</span>
            </div>
            <div className="mt-1 font-headline text-base font-semibold text-on-surface">
              {loan.termMonths} meses
            </div>
          </div>

          <div className="rounded-xl border border-surface-variant/30 bg-surface-container p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <Calendar className="h-3.5 w-3.5 text-error" />
              <span>Total intereses</span>
            </div>
            <div className="mt-1 font-headline text-base font-semibold text-error">
              {formatMoney(totalInterest, currency)}
            </div>
          </div>
        </div>

        {/* Tabla con scroll */}
        <div className="flex-1 overflow-auto p-space-md">
          <div className="overflow-hidden rounded-xl border border-surface-variant/30">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-variant/40 bg-surface-container-high font-semibold text-on-surface-variant">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3 text-right">Cuota</th>
                  <th className="py-2.5 px-3 text-right">Interés</th>
                  <th className="py-2.5 px-3 text-right">Capital</th>
                  <th className="py-2.5 px-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/20 font-medium text-on-surface">
                {rows.map((row) => (
                  <tr
                    key={row.period}
                    className="transition-colors hover:bg-surface-variant/20"
                  >
                    <td className="py-2 px-3 text-on-surface-variant">{row.period}</td>
                    <td className="py-2 px-3">{row.date}</td>
                    <td className="py-2 px-3 text-right text-primary">
                      {formatMoney(row.payment, currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-error">
                      {formatMoney(row.interest, currency)}
                    </td>
                    <td className="py-2 px-3 text-right text-secondary">
                      {formatMoney(row.principal, currency)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">
                      {formatMoney(row.balance, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-surface-variant/40 bg-surface-container-high font-semibold text-on-surface">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3">
                    Totales
                  </td>
                  <td className="py-2.5 px-3 text-right text-primary">
                    {formatMoney(totalPayment, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-error">
                    {formatMoney(totalInterest, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-secondary">
                    {formatMoney(loan.principal, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right">0,00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-surface-variant/30 bg-surface-container-low px-space-md py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-surface-variant/60 bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-variant"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
