import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CreateTransactionDTO, UpdateTransactionDTO } from '@/data/repository';
import { suggestCategory } from '@/domain/categories';
import { parseMoney } from '@/domain/money';
import type {
  Account,
  Category,
  CurrencyCode,
  Transaction,
  TransactionType,
} from '@/domain/models';

export interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: readonly Account[];
  categories: readonly Category[];
  transactionToEdit?: Transaction | null | undefined;
  onSubmit: (dto: CreateTransactionDTO | UpdateTransactionDTO) => Promise<void>;
}

export function TransactionFormModal({
  isOpen,
  onClose,
  accounts,
  categories,
  transactionToEdit,
  onSubmit,
}: TransactionFormModalProps) {
  const isEditing = !!transactionToEdit;

  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Autocategorización inteligente
  const [suggestedCategoryName, setSuggestedCategoryName] = useState<string | null>(null);
  const [isManualCategory, setIsManualCategory] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicialización de estado al abrir
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAccountId(transactionToEdit.accountId);
      setToAccountId(transactionToEdit.toAccountId ?? '');
      setAmount((transactionToEdit.amount / 100).toString().replace('.', ','));
      setDate(transactionToEdit.date);
      setDescription(transactionToEdit.description);
      setCategoryId(transactionToEdit.categoryId ?? '');
      setNotes(transactionToEdit.notes ?? '');
      setIsManualCategory(true);
      setSuggestedCategoryName(null);
    } else {
      setType('expense');
      setAccountId(accounts[0]?.id ?? '');
      setToAccountId(accounts[1]?.id ?? '');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setCategoryId('');
      setNotes('');
      setIsManualCategory(false);
      setSuggestedCategoryName(null);
    }
    setError(null);
  }, [transactionToEdit, isOpen, accounts]);

  if (!isOpen) return null;

  // Divisa de la cuenta seleccionada
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency: CurrencyCode = selectedAccount?.currency ?? 'DOP';

  // Manejo de cambio en descripción con sugerencia de categoría en tiempo real
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDesc = e.target.value;
    setDescription(newDesc);

    if (type !== 'transfer' && !isManualCategory) {
      const suggested = suggestCategory(newDesc, type, categories);
      if (suggested) {
        setCategoryId(suggested.id);
        setSuggestedCategoryName(suggested.name);
      } else {
        setSuggestedCategoryName(null);
      }
    }
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
    setIsManualCategory(true);
    setSuggestedCategoryName(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError('La descripción es obligatoria.');
      return;
    }

    if (!accountId) {
      setError('Debes seleccionar una cuenta de origen.');
      return;
    }

    if (type === 'transfer') {
      if (!toAccountId) {
        setError('Debes seleccionar la cuenta de destino.');
        return;
      }
      if (toAccountId === accountId) {
        setError('La cuenta de destino debe ser diferente a la de origen.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const parsedAmount = Math.abs(parseMoney(amount, currency));

      if (parsedAmount <= 0) {
        setError('El monto debe ser mayor que cero.');
        setIsSubmitting(false);
        return;
      }

      const assignedCategory = type === 'transfer' ? null : categoryId || null;

      if (isEditing && transactionToEdit) {
        const updateDTO: UpdateTransactionDTO = {
          type,
          accountId,
          amount: parsedAmount,
          date,
          description: trimmedDesc,
          categoryId: assignedCategory,
          ...(type === 'transfer' && toAccountId ? { toAccountId } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        };
        await onSubmit(updateDTO);
      } else {
        const createDTO: CreateTransactionDTO = {
          type,
          accountId,
          amount: parsedAmount,
          date,
          description: trimmedDesc,
          categoryId: assignedCategory,
          ...(type === 'transfer' && toAccountId ? { toAccountId } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        };
        await onSubmit(createDTO);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    type === 'transfer' ? false : c.kind === type,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-surface-variant/40 bg-surface-container shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-surface-variant/30 px-space-md py-3.5">
          <div>
            <h2
              id="transaction-modal-title"
              className="font-headline text-headline-sm font-semibold text-on-surface"
            >
              {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Registra un movimiento financiero en tus cuentas
            </p>
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-space-md space-y-4">
          {error && (
            <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-xs text-error">
              {error}
            </div>
          )}

          {/* Selector de Tipo (Gasto, Ingreso, Transferencia) */}
          <div>
            <label
              htmlFor="tx-type"
              className="block text-xs font-semibold text-on-surface mb-1.5"
            >
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setIsManualCategory(false);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  type === 'expense'
                    ? 'border-error bg-error/15 text-error shadow-sm'
                    : 'border-surface-variant/40 bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setIsManualCategory(false);
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  type === 'income'
                    ? 'border-primary bg-primary/15 text-primary shadow-sm'
                    : 'border-surface-variant/40 bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                <span>Ingreso</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('transfer');
                  setCategoryId('');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                  type === 'transfer'
                    ? 'border-secondary bg-secondary/15 text-secondary shadow-sm'
                    : 'border-surface-variant/40 bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Transferencia</span>
              </button>
            </div>
            {/* Input oculto asociado con label para pruebas de accesibilidad */}
            <select
              id="tx-type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="sr-only"
            >
              <option value="expense">expense</option>
              <option value="income">income</option>
              <option value="transfer">transfer</option>
            </select>
          </div>

          {/* Importe y Fecha */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                Monto ({currency})
              </label>
              <input
                id="tx-amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2.5 text-sm font-numeral text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                Fecha
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Descripción con indicador de autocategorización */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tx-description"
                className="text-xs font-semibold text-on-surface"
              >
                Descripción
              </label>
              {suggestedCategoryName && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>Sugerido: {suggestedCategoryName}</span>
                </span>
              )}
            </div>
            <input
              id="tx-description"
              type="text"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Ej. Supermercado, Salario quincenal, Netflix"
              required
              className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Cuentas: Origen y Destino */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tx-account"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                {type === 'transfer' ? 'Cuenta de origen' : 'Cuenta'}
              </label>
              <select
                id="tx-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label
                  htmlFor="tx-to-account"
                  className="block text-xs font-semibold text-on-surface mb-1.5"
                >
                  Cuenta de destino
                </label>
                <select
                  id="tx-to-account"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="">Selecciona cuenta destino</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Categoría (Oculta en transferencias) */}
          {type !== 'transfer' && (
            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                Categoría
              </label>
              <select
                id="tx-category"
                value={categoryId}
                onChange={handleCategorySelect}
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Sin categoría</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notas adicionales */}
          <div>
            <label
              htmlFor="tx-notes"
              className="block text-xs font-semibold text-on-surface mb-1.5"
            >
              Notas adicionales (opcional)
            </label>
            <textarea
              id="tx-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el recibo, factura o comercio..."
              className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-surface-variant/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-surface-variant/60 bg-surface-container px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-fixed disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar transacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
