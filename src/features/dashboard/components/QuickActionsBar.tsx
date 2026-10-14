import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ScanLine,
} from 'lucide-react';

export interface QuickActionsBarProps {
  onDeposit?: (() => void) | undefined;
  onTransfer?: (() => void) | undefined;
  onExpense?: (() => void) | undefined;
  onScanBill?: (() => void) | undefined;
}

export function QuickActionsBar({
  onDeposit,
  onTransfer,
  onExpense,
  onScanBill,
}: QuickActionsBarProps) {
  return (
    <div
      role="group"
      aria-label="Acciones rápidas"
      className="grid grid-cols-4 gap-2 sm:gap-4 py-2"
    >
      {/* Deposit Funds */}
      <button
        type="button"
        aria-label="Deposit Funds"
        onClick={onDeposit}
        className="group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
      >
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/20 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/25 active:scale-95">
          <ArrowDownLeft className="h-6 w-6 transition-transform group-hover:-translate-y-0.5" />
        </div>
        <span className="font-label-sm text-[11px] sm:text-label-sm font-medium text-on-surface-variant group-hover:text-on-surface text-center">
          Deposit Funds
        </span>
      </button>

      {/* Transfer Capital */}
      <button
        type="button"
        aria-label="Transfer Capital"
        onClick={onTransfer}
        className="group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
      >
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary border border-secondary/20 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-secondary/25 active:scale-95">
          <ArrowLeftRight className="h-6 w-6 transition-transform group-hover:rotate-12" />
        </div>
        <span className="font-label-sm text-[11px] sm:text-label-sm font-medium text-on-surface-variant group-hover:text-on-surface text-center">
          Transfer Capital
        </span>
      </button>

      {/* Add Expense */}
      <button
        type="button"
        aria-label="Add Expense"
        onClick={onExpense}
        className="group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
      >
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-error/15 text-error border border-error/20 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-error/25 active:scale-95">
          <ArrowUpRight className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
        </div>
        <span className="font-label-sm text-[11px] sm:text-label-sm font-medium text-on-surface-variant group-hover:text-on-surface text-center">
          Add Expense
        </span>
      </button>

      {/* Scan Bill */}
      <button
        type="button"
        aria-label="Scan Bill"
        onClick={onScanBill}
        className="group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
      >
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant border border-surface-variant/40 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-surface-container-highest group-hover:text-on-surface active:scale-95">
          <ScanLine className="h-6 w-6 transition-transform group-hover:scale-110" />
        </div>
        <span className="font-label-sm text-[11px] sm:text-label-sm font-medium text-on-surface-variant group-hover:text-on-surface text-center">
          Scan Bill
        </span>
      </button>
    </div>
  );
}
