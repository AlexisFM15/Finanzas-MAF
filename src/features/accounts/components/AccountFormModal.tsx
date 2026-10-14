import { CreditCard, DollarSign, Landmark, Wallet, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CreateAccountDTO, UpdateAccountDTO } from '@/data/repository';
import { parseMoney } from '@/domain/money';
import type { Account, AccountType, CurrencyCode } from '@/domain/models';

export interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
  onSubmit: (dto: CreateAccountDTO | UpdateAccountDTO) => Promise<void>;
}

const COLOR_PRESETS = [
  '#4edea3', // Primary green
  '#4cd7f6', // Secondary cyan
  '#acedff', // Soft blue
  '#d0bcff', // Tertiary purple
  '#ffb4ab', // Coral / Red
  '#fde047', // Yellow
  '#f97316', // Orange
  '#38bdf8', // Sky
];

export function AccountFormModal({
  isOpen,
  onClose,
  accountToEdit,
  onSubmit,
}: AccountFormModalProps) {
  const isEditing = !!accountToEdit;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<CurrencyCode>('DOP');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [institution, setInstitution] = useState('');
  const [color, setColor] = useState('#4edea3');

  // Tarjeta de crédito
  const [creditLimit, setCreditLimit] = useState('');

  // Préstamo
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanAnnualRate, setLoanAnnualRate] = useState('12'); // 12%
  const [loanTermMonths, setLoanTermMonths] = useState('36');
  const [loanStartDate, setLoanStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar o resetear formulario
  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency);
      // Para editar, mostrar en decimales
      const bal = accountToEdit.openingBalance / 100;
      setOpeningBalance(bal.toString().replace('.', ','));
      setInstitution(accountToEdit.institution ?? '');
      setColor(accountToEdit.color);

      if (accountToEdit.creditLimit !== undefined) {
        setCreditLimit((accountToEdit.creditLimit / 100).toString().replace('.', ','));
      } else {
        setCreditLimit('');
      }

      if (accountToEdit.loan) {
        setLoanPrincipal(
          (accountToEdit.loan.principal / 100).toString().replace('.', ','),
        );
        setLoanAnnualRate((accountToEdit.loan.annualRate * 100).toString());
        setLoanTermMonths(accountToEdit.loan.termMonths.toString());
        setLoanStartDate(accountToEdit.loan.startDate);
      } else {
        setLoanPrincipal('');
        setLoanAnnualRate('12');
        setLoanTermMonths('36');
        setLoanStartDate(new Date().toISOString().slice(0, 10));
      }
    } else {
      setName('');
      setType('checking');
      setCurrency('DOP');
      setOpeningBalance('0');
      setInstitution('');
      setColor('#4edea3');
      setCreditLimit('');
      setLoanPrincipal('');
      setLoanAnnualRate('12');
      setLoanTermMonths('36');
      setLoanStartDate(new Date().toISOString().slice(0, 10));
    }
    setError(null);
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);

      let parsedOpeningBalance = 0;
      if (type === 'loan') {
        const principalCents = loanPrincipal
          ? parseMoney(loanPrincipal, currency)
          : parseMoney(openingBalance, currency);
        // Préstamo empieza con balance negativo de deuda
        parsedOpeningBalance = -Math.abs(principalCents);
      } else {
        parsedOpeningBalance = parseMoney(openingBalance, currency);
      }

      let parsedCreditLimit: number | undefined;
      if (type === 'credit_card' && creditLimit.trim()) {
        parsedCreditLimit = Math.abs(parseMoney(creditLimit, currency));
      }

      let parsedLoan: Account['loan'] | undefined;
      if (type === 'loan') {
        const principalCents = loanPrincipal
          ? Math.abs(parseMoney(loanPrincipal, currency))
          : Math.abs(parsedOpeningBalance);
        const rateNumber = parseFloat(loanAnnualRate.replace(',', '.')) / 100;
        const monthsNumber = parseInt(loanTermMonths, 10);

        parsedLoan = {
          principal: principalCents,
          annualRate: rateNumber || 0,
          termMonths: monthsNumber || 12,
          startDate: loanStartDate || new Date().toISOString().slice(0, 10),
        };
      }

      if (isEditing && accountToEdit) {
        const updateDTO: UpdateAccountDTO = {
          name: trimmedName,
          type,
          currency,
          openingBalance: parsedOpeningBalance,
          institution: institution.trim() || undefined,
          color,
          creditLimit: parsedCreditLimit,
          loan: parsedLoan,
        };
        await onSubmit(updateDTO);
      } else {
        const createDTO: CreateAccountDTO = {
          name: trimmedName,
          type,
          currency,
          openingBalance: parsedOpeningBalance,
          institution: institution.trim() || undefined,
          color,
          archived: false,
          creditLimit: parsedCreditLimit,
          loan: parsedLoan,
        };
        await onSubmit(createDTO);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
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
          <div className="flex items-center gap-space-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="account-modal-title"
                className="font-headline text-headline-sm font-semibold text-on-surface"
              >
                {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Configura los detalles de tu cuenta o producto financiero
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-space-md space-y-4">
          {error && (
            <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-xs text-error">
              {error}
            </div>
          )}

          {/* Nombre de la cuenta */}
          <div>
            <label
              htmlFor="account-name"
              className="block text-xs font-semibold text-on-surface mb-1.5"
            >
              Nombre de la cuenta
            </label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Banco BHD — Nómina"
              required
              className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Tipo de Cuenta y Divisa */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="account-type"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                Tipo de cuenta
              </label>
              <select
                id="account-type"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="checking">Cuenta Corriente</option>
                <option value="savings">Cuenta de Ahorros</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="loan">Préstamo</option>
                <option value="cash">Efectivo</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="account-currency"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                Divisa
              </label>
              <select
                id="account-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="DOP">DOP — Peso Dominicano</option>
                <option value="USD">USD — Dólar Estadounidense</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          {/* Saldo Inicial (oculto si es préstamo, ya que usa el principal) */}
          {type !== 'loan' && (
            <div>
              <label
                htmlFor="account-balance"
                className="block text-xs font-semibold text-on-surface mb-1.5"
              >
                Saldo inicial
              </label>
              <input
                id="account-balance"
                type="text"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none font-numeral"
              />
              <span className="text-[11px] text-on-surface-variant">
                En tarjetas de crédito, saldo negativo representa deuda pendiente.
              </span>
            </div>
          )}

          {/* Institución Financiera */}
          <div>
            <label
              htmlFor="account-institution"
              className="block text-xs font-semibold text-on-surface mb-1.5"
            >
              Institución o Banco (opcional)
            </label>
            <input
              id="account-institution"
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ej. Banco BHD, Banreservas, Popular"
              className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Campos condicionales: Tarjeta de Crédito */}
          {type === 'credit_card' && (
            <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-3 space-y-3">
              <div>
                <label
                  htmlFor="account-credit-limit"
                  className="block text-xs font-semibold text-on-surface mb-1.5"
                >
                  Límite de crédito
                </label>
                <input
                  id="account-credit-limit"
                  type="text"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="Ej. 100000"
                  className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Campos condicionales: Préstamo */}
          {type === 'loan' && (
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 space-y-3">
              <div>
                <label
                  htmlFor="account-loan-principal"
                  className="block text-xs font-semibold text-on-surface mb-1.5"
                >
                  Monto del préstamo
                </label>
                <input
                  id="account-loan-principal"
                  type="text"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  placeholder="Ej. 50000"
                  className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="account-loan-rate"
                    className="block text-xs font-semibold text-on-surface mb-1.5"
                  >
                    Tasa de interés anual (%)
                  </label>
                  <input
                    id="account-loan-rate"
                    type="text"
                    value={loanAnnualRate}
                    onChange={(e) => setLoanAnnualRate(e.target.value)}
                    placeholder="Ej. 12"
                    className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="account-loan-months"
                    className="block text-xs font-semibold text-on-surface mb-1.5"
                  >
                    Plazo en meses
                  </label>
                  <input
                    id="account-loan-months"
                    type="number"
                    min="1"
                    max="360"
                    value={loanTermMonths}
                    onChange={(e) => setLoanTermMonths(e.target.value)}
                    className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="account-loan-start-date"
                  className="block text-xs font-semibold text-on-surface mb-1.5"
                >
                  Fecha de inicio
                </label>
                <input
                  id="account-loan-start-date"
                  type="date"
                  value={loanStartDate}
                  onChange={(e) => setLoanStartDate(e.target.value)}
                  className="w-full rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Selector de Color */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">
              Color identificador
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  className={`h-7 w-7 rounded-full transition-all ${
                    color === preset
                      ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-surface-container'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
          </div>

          {/* Footer de Acciones */}
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
              {isSubmitting ? 'Guardando...' : 'Guardar cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
