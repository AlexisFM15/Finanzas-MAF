import { useEffect, useState } from 'react';
import { HeroNetWorthCard } from './components/HeroNetWorthCard';
import { QuickActionsBar } from './components/QuickActionsBar';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { CategoryExpenseDonutChart } from './components/CategoryExpenseDonutChart';
import { RecentTransactionsWidget } from './components/RecentTransactionsWidget';
import { TransactionFormModal } from '../transactions/components/TransactionFormModal';
import type { AppRepository, CreateTransactionDTO } from '@/data/repository';
import { useAccountsStore } from '@/state/useAccountsStore';
import { useTransactionsStore } from '@/state/useTransactionsStore';
import {
  Tag,
  Sparkles,
  Laptop,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

export interface DashboardPageProps {
  repo?: AppRepository | undefined;
}

interface DealItem {
  id: string;
  title: string;
  subtitle: string;
  savings: string;
  price: string;
  discount: string;
  icon: 'laptop' | 'headphones';
}

const DEALS: DealItem[] = [
  {
    id: 'deal-1',
    title: 'MacBook Pro 14" M3',
    subtitle: '512GB Space Gray',
    savings: 'Ahorro $250',
    price: '$1,749.00',
    discount: '-12.5% Drop',
    icon: 'laptop',
  },
  {
    id: 'deal-2',
    title: 'Sony WH-1000XM5',
    subtitle: 'Noise Canceling Wireless',
    savings: 'Ahorro $71',
    price: '$328.00',
    discount: '-17.8% Drop',
    icon: 'headphones',
  },
];

export function DashboardPage({ repo }: DashboardPageProps) {
  const {
    accounts,
    isLoading: isAccLoading,
    loadAccounts,
  } = useAccountsStore();

  const {
    transactions,
    categories,
    isLoading: isTxLoading,
    loadData: loadTxData,
    createTransaction,
  } = useTransactionsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts(repo);
    loadTxData(repo);
  }, [repo, loadAccounts, loadTxData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (dto: CreateTransactionDTO) => {
    await createTransaction(dto);
    setIsModalOpen(false);
    showToast('Transacción registrada exitosamente');
  };

  const isLoading = (isAccLoading || isTxLoading) && accounts.length === 0;

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-xl animate-fade-up"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-4xl flex-col space-y-space-md sm:space-y-space-lg px-gutter pb-space-xl">
        {/* 1. Hero Wealth Overview */}
        <HeroNetWorthCard
          accounts={accounts}
          transactions={transactions}
          isLoading={isLoading}
        />

        {/* 2. Quick Actions */}
        <div className="rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-sm sm:p-space-md shadow-sm">
          <QuickActionsBar
            onDeposit={() => handleOpenModal()}
            onTransfer={() => handleOpenModal()}
            onExpense={() => handleOpenModal()}
            onScanBill={() =>
              showToast('Función OCR de escaneo de facturas disponible próximamente')
            }
          />
        </div>

        {/* 3. Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
          {/* Income vs Expense Monthly Bar Chart */}
          <IncomeExpenseChart
            transactions={transactions}
            isLoading={isLoading}
          />

          {/* Category Expenses Donut Chart */}
          <CategoryExpenseDonutChart
            transactions={transactions}
            categories={categories}
            isLoading={isLoading}
          />
        </div>

        {/* 4. Recent Transactions Widget */}
        <RecentTransactionsWidget
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          isLoading={isLoading}
        />

        {/* 5. Smart Opportunities / Deals Section */}
        <section
          aria-label="Oportunidades de ahorro inteligentes"
          className="flex flex-col rounded-2xl border border-surface-variant/40 bg-surface-container-low p-space-md sm:p-space-lg shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-headline-sm text-sm sm:text-base font-semibold text-on-surface">
                Oportunidades de Ahorro
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Tag className="h-3 w-3" />
              <span>Smart Deals</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEALS.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-3 rounded-xl border border-surface-variant/30 bg-surface-container/40 hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface">
                    {deal.icon === 'laptop' ? (
                      <Laptop className="h-5 w-5" />
                    ) : (
                      <Headphones className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-semibold text-on-surface">
                      {deal.title}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {deal.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-xs font-bold text-on-surface">
                    {deal.price}
                  </span>
                  <span className="text-[10px] font-semibold text-primary">
                    {deal.savings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Transaction Form Modal */}
      {isModalOpen && (
        <TransactionFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          accounts={accounts}
          categories={categories}
          onSubmit={handleCreateSubmit as (dto: any) => Promise<void>}
        />
      )}
    </div>
  );
}
