import {
  AlertTriangle,
  Building2,
  CreditCard,
  FileText,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AccountCard } from './components/AccountCard';
import { AccountFormModal } from './components/AccountFormModal';
import { AccountsSummary } from './components/AccountsSummary';
import { AmortizationScheduleModal } from './components/AmortizationScheduleModal';
import type { AppRepository, CreateAccountDTO, UpdateAccountDTO } from '@/data/repository';
import type { Account, AccountType } from '@/domain/models';
import { useAccountsStore } from '@/state/useAccountsStore';

export interface AccountsPageProps {
  repo?: AppRepository;
}

type TabType = 'all' | AccountType;

const TABS: Array<{ id: TabType; label: string; icon: typeof Wallet }> = [
  { id: 'all', label: 'Todas', icon: Wallet },
  { id: 'checking', label: 'Bancos', icon: Building2 },
  { id: 'savings', label: 'Ahorros', icon: PiggyBank },
  { id: 'credit_card', label: 'Tarjetas', icon: CreditCard },
  { id: 'loan', label: 'Préstamos', icon: FileText },
  { id: 'cash', label: 'Efectivo', icon: Wallet },
];

export function AccountsPage({ repo }: AccountsPageProps) {
  const {
    accounts,
    isLoading,
    loadAccounts,
    createAccount,
    updateAccount,
    toggleArchiveAccount,
    deleteAccount,
    getBalances,
  } = useAccountsStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isAmortizationOpen, setIsAmortizationOpen] = useState(false);
  const [amortizationAccount, setAmortizationAccount] = useState<Account | null>(null);

  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  useEffect(() => {
    loadAccounts(repo);
  }, [repo, loadAccounts]);

  const balances = useMemo(() => getBalances(), [getBalances, accounts]);

  // Conteo de cuentas archivadas
  const archivedCount = useMemo(
    () => accounts.filter((a) => a.archived).length,
    [accounts],
  );

  // Filtrado de cuentas
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Filtro de archivadas
      if (!showArchived && acc.archived) return false;

      // Filtro por pestaña
      if (activeTab !== 'all' && acc.type !== activeTab) return false;

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = acc.name.toLowerCase().includes(query);
        const matchesInstitution = acc.institution?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesInstitution) return false;
      }

      return true;
    });
  }, [accounts, activeTab, showArchived, searchQuery]);

  // Manejadores
  const handleOpenCreate = () => {
    setAccountToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setAccountToEdit(acc);
    setIsFormOpen(true);
  };

  const handleOpenAmortization = (acc: Account) => {
    setAmortizationAccount(acc);
    setIsAmortizationOpen(true);
  };

  const handleFormSubmit = async (dto: CreateAccountDTO | UpdateAccountDTO) => {
    if (accountToEdit) {
      await updateAccount(accountToEdit.id, dto as UpdateAccountDTO, repo);
    } else {
      await createAccount(dto as CreateAccountDTO, repo);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    await deleteAccount(accountToDelete.id, repo);
    setAccountToDelete(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-gutter pb-space-xl">
      {/* Barra superior con título y botón de acción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div className="flex items-center gap-space-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-headline text-headline-sm sm:text-headline-md font-bold text-on-surface">
              Cuentas
            </h1>
            <p className="text-xs text-on-surface-variant">
              Cuentas bancarias, tarjetas de crédito, préstamos y efectivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAccounts(repo)}
            title="Recargar datos"
            aria-label="Recargar datos"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-variant/40 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary-fixed"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>

      {/* Resumen Financiero Consolidado */}
      <AccountsSummary accounts={accounts} balances={balances} />

      {/* Barra de Filtros, Búsqueda y Opciones */}
      <div className="flex flex-col gap-space-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Pestañas de categorías */}
        <div
          role="tablist"
          aria-label="Filtrar por tipo de cuenta"
          className="flex flex-wrap items-center gap-1.5 rounded-xl border border-surface-variant/30 bg-surface-container-low p-1 text-xs"
        >
          {TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? accounts.filter((a) => showArchived || !a.archived).length
                : accounts.filter(
                    (a) => a.type === tab.id && (showArchived || !a.archived),
                  ).length;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-surface-container-high text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-variant/50 text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador y Toggle de Archivadas */}
        <div className="flex items-center gap-space-sm">
          {/* Búsqueda */}
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-xl border border-surface-variant/40 bg-surface-container-low py-1.5 pl-8 pr-3 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Toggle de archivadas */}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-on-surface-variant select-none">
            <input
              type="checkbox"
              aria-label="Mostrar archivadas"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-surface-variant bg-surface-container accent-primary focus:ring-0"
            />
            <span className="whitespace-nowrap">
              Archivadas {archivedCount > 0 && `(${archivedCount})`}
            </span>
          </label>
        </div>
      </div>

      {/* Grid de Tarjetas de Cuenta */}
      {filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-variant/50 bg-surface-container-low py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-variant/40 text-on-surface-variant mb-3">
            <Wallet className="h-6 w-6" />
          </div>
          <h3 className="font-headline text-base font-semibold text-on-surface">
            No hay cuentas para mostrar
          </h3>
          <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
            {searchQuery
              ? 'No se encontraron cuentas que coincidan con la búsqueda.'
              : 'Agrega una cuenta bancaria, tarjeta de crédito o préstamo para comenzar.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:bg-primary-fixed"
          >
            <Plus className="h-4 w-4" />
            <span>Crear primera cuenta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => {
            const bal = balances.get(account.id) ?? account.openingBalance;
            return (
              <AccountCard
                key={account.id}
                account={account}
                balance={bal}
                onEdit={handleOpenEdit}
                onToggleArchive={(acc) => toggleArchiveAccount(acc.id, repo)}
                onDelete={(acc) => setAccountToDelete(acc)}
                onViewAmortization={handleOpenAmortization}
              />
            );
          })}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <AccountFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        accountToEdit={accountToEdit}
        onSubmit={handleFormSubmit}
      />

      {/* Modal de Cuadro de Amortización */}
      <AmortizationScheduleModal
        isOpen={isAmortizationOpen}
        account={amortizationAccount}
        onClose={() => setIsAmortizationOpen(false)}
      />

      {/* Modal de Confirmación de Eliminación */}
      {accountToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setAccountToDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-error/30 bg-surface-container p-space-md shadow-2xl">
            <div className="flex items-center gap-space-xs text-error mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-headline text-base font-semibold text-on-surface">
                Eliminar cuenta
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              ¿Estás seguro de que deseas eliminar permanentemente{' '}
              <strong className="text-on-surface">{accountToDelete.name}</strong>? Esta
              acción no se puede deshacer.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="rounded-xl border border-surface-variant bg-surface-container-high px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-variant"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-error px-4 py-1.5 text-xs font-bold text-on-error hover:bg-error-container"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
