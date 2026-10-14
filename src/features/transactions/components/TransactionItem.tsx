import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { formatMoney } from '@/domain/money';
import type { Account, Category, Transaction } from '@/domain/models';

export interface TransactionItemProps {
  transaction: Transaction;
  account?: Account;
  toAccount?: Account;
  category?: Category;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionItem({
  transaction,
  account,
  toAccount,
  category,
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const currency = account?.currency ?? 'DOP';

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  const typeConfig = isIncome
    ? {
        icon: ArrowDownLeft,
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        amountColor: 'text-primary',
        sign: '+',
      }
    : isExpense
      ? {
          icon: ArrowUpRight,
          iconBg: 'bg-error/10',
          iconColor: 'text-error',
          amountColor: 'text-error',
          sign: '-',
        }
      : {
          icon: ArrowLeftRight,
          iconBg: 'bg-secondary/10',
          iconColor: 'text-secondary',
          amountColor: 'text-secondary',
          sign: '',
        };

  const IconComponent = typeConfig.icon;

  return (
    <div className="group relative flex items-center justify-between rounded-xl border border-surface-variant/30 bg-surface-container-low p-space-md shadow-sm transition-all hover:border-surface-variant/60 hover:bg-surface-container">
      {/* Icono + Información */}
      <div className="flex items-center gap-space-sm min-w-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeConfig.iconBg} ${typeConfig.iconColor}`}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className="truncate font-semibold text-sm text-on-surface"
              title={transaction.description}
            >
              {transaction.description}
            </h4>
            {category && (
              <span
                className="hidden sm:inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                }}
              >
                {category.name}
              </span>
            )}
            {isTransfer && (
              <span className="hidden sm:inline-flex rounded-md bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                Transferencia
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
            {isTransfer ? (
              <span className="truncate">
                {account?.name ?? 'Cuenta'} → {toAccount?.name ?? 'Destino'}
              </span>
            ) : (
              <span className="truncate">{account?.name ?? 'Cuenta'}</span>
            )}
            <span>•</span>
            <span>{transaction.date}</span>
            {transaction.notes && (
              <>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline truncate max-w-[150px] italic">
                  {transaction.notes}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Importe y Acciones */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <div className="text-right">
          <div
            className={`font-headline text-sm sm:text-base font-semibold ${typeConfig.amountColor}`}
          >
            {typeConfig.sign}
            {formatMoney(transaction.amount, currency)}
          </div>
          {category && (
            <div className="sm:hidden text-[11px] text-on-surface-variant text-right">
              {category.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            aria-label="Editar transacción"
            title="Editar transacción"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction)}
            aria-label="Eliminar transacción"
            title="Eliminar transacción"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-error/80 transition-colors hover:bg-error/15 hover:text-error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
