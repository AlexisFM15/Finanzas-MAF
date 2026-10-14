import {
  Archive,
  ArchiveRestore,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Pencil,
  PiggyBank,
  Trash2,
  Wallet,
} from 'lucide-react';
import { availableCredit } from '@/domain/balances';
import { formatMoney } from '@/domain/money';
import type { Account, AccountType, Cents } from '@/domain/models';

export interface AccountCardProps {
  account: Account;
  balance: Cents;
  onEdit: (account: Account) => void;
  onToggleArchive: (account: Account) => void;
  onDelete: (account: Account) => void;
  onViewAmortization?: (account: Account) => void;
}

const TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: typeof Wallet; badgeBg: string; badgeText: string }
> = {
  checking: {
    label: 'Corriente',
    icon: Building2,
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
  },
  savings: {
    label: 'Ahorro',
    icon: PiggyBank,
    badgeBg: 'bg-secondary/10',
    badgeText: 'text-secondary',
  },
  credit_card: {
    label: 'Tarjeta',
    icon: CreditCard,
    badgeBg: 'bg-tertiary/10',
    badgeText: 'text-tertiary',
  },
  loan: {
    label: 'Préstamo',
    icon: FileText,
    badgeBg: 'bg-error/10',
    badgeText: 'text-error',
  },
  cash: {
    label: 'Efectivo',
    icon: Wallet,
    badgeBg: 'bg-surface-variant',
    badgeText: 'text-on-surface',
  },
};

export function AccountCard({
  account,
  balance,
  onEdit,
  onToggleArchive,
  onDelete,
  onViewAmortization,
}: AccountCardProps) {
  const config = TYPE_CONFIG[account.type] ?? TYPE_CONFIG.cash;
  const IconComponent = config.icon;

  // Cálculos para tarjetas de crédito
  const isCreditCard = account.type === 'credit_card';
  const availCredit = isCreditCard ? availableCredit(account, balance) : null;
  const creditLimit = account.creditLimit ?? 0;
  const usedCredit = Math.max(0, -balance);
  const utilizationPct = creditLimit > 0 ? Math.min(100, Math.round((usedCredit / creditLimit) * 100)) : 0;

  // Préstamo
  const isLoan = account.type === 'loan' && !!account.loan;

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-surface-container-low p-space-md shadow-sm transition-all hover:border-surface-variant ${
        account.archived
          ? 'border-surface-variant/30 opacity-60'
          : 'border-surface-variant/40 hover:shadow-md'
      }`}
    >
      {/* Barra de color de la cuenta */}
      <div
        className="absolute top-0 left-0 h-1 w-full"
        style={{ backgroundColor: account.color || '#4edea3' }}
      />

      {/* Cabecera de la tarjeta */}
      <div>
        <div className="flex items-start justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.badgeBg} ${config.badgeText}`}
            >
              <IconComponent className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-on-surface" title={account.name}>
                {account.name}
              </h3>
              {account.institution && (
                <p className="truncate text-xs text-on-surface-variant">{account.institution}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {account.archived && (
              <span className="rounded-md bg-surface-variant px-1.5 py-0.5 text-[10px] font-medium uppercase text-on-surface-variant">
                Archivada
              </span>
            )}
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
            >
              {config.label}
            </span>
          </div>
        </div>

        {/* Saldo actual */}
        <div className="mt-4">
          <span className="text-xs text-on-surface-variant">Saldo actual</span>
          <div
            className={`font-headline-md text-headline-md font-semibold tracking-tight ${
              balance < 0 ? 'text-error' : 'text-on-surface'
            }`}
          >
            {formatMoney(balance, account.currency)}
          </div>
        </div>

        {/* Detalles específicos: Tarjeta de Crédito */}
        {isCreditCard && creditLimit > 0 && (
          <div className="mt-3 space-y-1.5 rounded-xl bg-surface-container/60 p-2.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Límite de crédito:</span>
              <span className="font-medium text-on-surface">
                {formatMoney(creditLimit, account.currency)}
              </span>
            </div>
            {availCredit !== null && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Crédito disponible:</span>
                <span
                  className={`font-medium ${availCredit < 0 ? 'text-error' : 'text-primary'}`}
                >
                  {formatMoney(availCredit, account.currency)}
                </span>
              </div>
            )}
            <div className="pt-1">
              <div className="flex justify-between text-[11px] text-on-surface-variant mb-1">
                <span>Uso ({utilizationPct}%)</span>
                <span>{formatMoney(usedCredit, account.currency)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                <div
                  className={`h-full transition-all ${
                    utilizationPct > 80
                      ? 'bg-error'
                      : utilizationPct > 50
                        ? 'bg-yellow-400'
                        : 'bg-primary'
                  }`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Detalles específicos: Préstamo */}
        {isLoan && account.loan && (
          <div className="mt-3 space-y-2 rounded-xl bg-surface-container/60 p-2.5 text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Principal original:</span>
              <span className="font-medium text-on-surface">
                {formatMoney(account.loan.principal, account.currency)}
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tasa anual:</span>
              <span className="font-medium text-on-surface">
                {(account.loan.annualRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Plazo:</span>
              <span className="font-medium text-on-surface">
                {account.loan.termMonths} meses
              </span>
            </div>

            {onViewAmortization && (
              <button
                type="button"
                onClick={() => onViewAmortization(account)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-secondary/20"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Tabla de amortización</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barra inferior de acciones */}
      <div className="mt-4 flex items-center justify-end gap-1 border-t border-surface-variant/30 pt-3">
        <button
          type="button"
          onClick={() => onEdit(account)}
          aria-label="Editar cuenta"
          title="Editar cuenta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onToggleArchive(account)}
          aria-label={account.archived ? 'Desarchivar cuenta' : 'Archivar cuenta'}
          title={account.archived ? 'Desarchivar cuenta' : 'Archivar cuenta'}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
        >
          {account.archived ? (
            <ArchiveRestore className="h-3.5 w-3.5" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onDelete(account)}
          aria-label="Eliminar cuenta"
          title="Eliminar cuenta"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-error/80 transition-colors hover:bg-error/15 hover:text-error"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
