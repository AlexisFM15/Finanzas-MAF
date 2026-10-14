import { useState } from 'react';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  status: string;
  type: TransactionType;
  icon: string;
  iconBg: string;
  iconColor: string;
  amountColor: string;
  statusColor?: string;
}

interface DealItem {
  id: string;
  title: string;
  subtitle: string;
  savings: string;
  price: string;
  originalPrice: string;
  discount: string;
  icon: string;
  retailers: Array<{ name: string; price: string; lowest?: boolean }>;
  badgeText?: string;
  hasAlert?: boolean;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Stripe Payout',
    subtitle: 'Freelance Retainer • Today 09:41',
    amount: '+$3,850.00',
    status: 'Cleared',
    type: 'income',
    icon: 'payments',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    amountColor: 'text-primary',
    statusColor: 'text-primary',
  },
  {
    id: 'tx-2',
    title: 'Apple Retail Store',
    subtitle: 'Tech & Gadgets • Yesterday',
    amount: '-$1,249.00',
    status: 'Apple Pay',
    type: 'expense',
    icon: 'storefront',
    iconBg: 'bg-surface-variant',
    iconColor: 'text-on-surface',
    amountColor: 'text-error',
    statusColor: 'text-on-surface-variant',
  },
  {
    id: 'tx-3',
    title: 'Vanguard Dividend Yield',
    subtitle: 'VTI Index ETF • Apr 21',
    amount: '+$412.50',
    status: 'Reinvested',
    type: 'income',
    icon: 'savings',
    iconBg: 'bg-secondary/15',
    iconColor: 'text-secondary',
    amountColor: 'text-primary',
    statusColor: 'text-on-surface-variant',
  },
  {
    id: 'tx-4',
    title: 'Whole Foods Market',
    subtitle: 'Organic Groceries • Apr 19',
    amount: '-$168.40',
    status: 'Debit Card',
    type: 'expense',
    icon: 'shopping_basket',
    iconBg: 'bg-surface-variant',
    iconColor: 'text-on-surface',
    amountColor: 'text-error',
    statusColor: 'text-on-surface-variant',
  },
  {
    id: 'tx-5',
    title: 'Figma Enterprise',
    subtitle: 'Recurring Sub • Apr 18',
    amount: '-$45.00',
    status: 'Auto Renew',
    type: 'expense',
    icon: 'category',
    iconBg: 'bg-tertiary/15',
    iconColor: 'text-tertiary',
    amountColor: 'text-on-surface',
    statusColor: 'text-on-surface-variant',
  },
];

const DEALS: DealItem[] = [
  {
    id: 'deal-1',
    title: 'MacBook Pro 14" M3',
    subtitle: '512GB Space Gray',
    savings: 'Save $250',
    price: '$1,749.00',
    originalPrice: '$1,999.00',
    discount: '-12.5% Drop',
    icon: 'laptop_mac',
    retailers: [
      { name: 'BestBuy', price: '$1,749 (Lowest)', lowest: true },
      { name: 'Amazon', price: '$1,849' },
      { name: 'Apple', price: '$1,999' },
    ],
  },
  {
    id: 'deal-2',
    title: 'Sony WH-1000XM5',
    subtitle: 'Noise Canceling Wireless',
    savings: 'Save $71',
    price: '$328.00',
    originalPrice: '$399.00',
    discount: '-17.8% Drop',
    icon: 'headphones',
    retailers: [
      { name: 'Walmart', price: '$328 (Lowest)', lowest: true },
      { name: 'Target', price: '$349' },
      { name: 'Sony Store', price: '$398' },
    ],
  },
  {
    id: 'deal-3',
    title: 'Dyson V15 Detect',
    subtitle: 'Cordless Vacuum Cleaner',
    savings: 'Save $100',
    price: '$649.00',
    originalPrice: '$749.00',
    discount: '-13.3% Drop',
    icon: 'cleaning_services',
    badgeText: 'Lowest seen in 60 days on Dyson.com',
    hasAlert: true,
    retailers: [],
  },
];

const BAR_CHART_MONTHS = [
  { month: 'Nov', inH: '65%', outH: '50%', active: false },
  { month: 'Dec', inH: '80%', outH: '70%', active: false },
  { month: 'Jan', inH: '60%', outH: '45%', active: false },
  { month: 'Feb', inH: '75%', outH: '40%', active: false },
  { month: 'Mar', inH: '85%', outH: '55%', active: false },
  { month: 'Apr', inH: '95%', outH: '48%', active: true },
];

export function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredTransactions = INITIAL_TRANSACTIONS.filter((tx) => {
    if (activeFilter === 'all') return true;
    return tx.type === activeFilter;
  });

  const triggerAction = (label: string) => {
    setActionNotice(`Acción rápida: ${label}`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  return (
    <div className="flex flex-col w-full">
      {/* NOTIFICACIÓN TOAST INLINE */}
      {actionNotice && (
        <div
          role="status"
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary shadow-lg animate-fade-up"
        >
          {actionNotice}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="mx-auto flex w-full max-w-lg flex-col space-y-space-lg px-gutter pb-space-xl">
        {/* TARJETA HERO WEALTH OVERVIEW */}
        <section
          id="hero-wealth-card"
            className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-xl"
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
                <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-primary">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span className="font-label-sm text-label-sm font-semibold">+8.2% MoM</span>
                </div>
              </div>

              {/* Main Balance Display */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
                    $84,620.50
                  </span>
                  <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
                    DOP
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-[15px]">north_east</span>
                  <span className="font-body-sm text-body-sm font-medium">
                    +$6,420.00 net increase this month
                  </span>
                </div>
              </div>

              {/* Incomes vs Expenses Dual Split Container */}
              <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                {/* Incomes */}
                <div className="flex flex-col rounded-lg bg-surface-container p-space-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Incomes
                    </span>
                    <div className="flex items-center text-[11px] font-semibold text-primary">
                      <span className="material-symbols-outlined text-[13px]">arrow_drop_up</span>
                      <span>12.4%</span>
                    </div>
                  </div>
                  <span className="font-numeral-md text-numeral-md mt-1 text-on-surface">
                    $14,850.00
                  </span>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full w-[78%] rounded-full bg-primary" />
                  </div>
                </div>

                {/* Expenses */}
                <div className="flex flex-col rounded-lg bg-surface-container p-space-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Expenses
                    </span>
                    <div className="flex items-center text-[11px] font-semibold text-secondary">
                      <span className="material-symbols-outlined text-[13px]">arrow_drop_down</span>
                      <span>3.1%</span>
                    </div>
                  </div>
                  <span className="font-numeral-md text-numeral-md mt-1 text-on-surface">
                    $8,430.00
                  </span>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full w-[44%] rounded-full bg-error" />
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-4 gap-space-xs pt-space-xs">
                <button
                  id="action-deposit"
                  type="button"
                  aria-label="Deposit Funds"
                  onClick={() => triggerAction('Deposit')}
                  className="flex flex-col items-center justify-center rounded-lg bg-primary px-1 py-2.5 text-on-primary shadow-md transition-transform hover:opacity-95 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span className="font-label-sm text-label-sm mt-1 font-semibold">Deposit</span>
                </button>
                <button
                  id="action-transfer"
                  type="button"
                  aria-label="Transfer Capital"
                  onClick={() => triggerAction('Transfer')}
                  className="flex flex-col items-center justify-center rounded-lg bg-surface-container-high px-1 py-2.5 text-on-surface transition-transform hover:bg-surface-variant active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    swap_horiz
                  </span>
                  <span className="font-label-sm text-label-sm mt-1">Transfer</span>
                </button>
                <button
                  id="action-expense"
                  type="button"
                  aria-label="Add Expense"
                  onClick={() => triggerAction('Expense')}
                  className="flex flex-col items-center justify-center rounded-lg bg-surface-container-high px-1 py-2.5 text-on-surface transition-transform hover:bg-surface-variant active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px] text-error">
                    receipt_long
                  </span>
                  <span className="font-label-sm text-label-sm mt-1">Expense</span>
                </button>
                <button
                  id="action-scan-bill"
                  type="button"
                  aria-label="Scan Bill"
                  onClick={() => triggerAction('Scan Bill')}
                  className="flex flex-col items-center justify-center rounded-lg bg-surface-container-high px-1 py-2.5 text-on-surface transition-transform hover:bg-surface-variant active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px] text-tertiary">
                    document_scanner
                  </span>
                  <span className="font-label-sm text-label-sm mt-1">Scan Bill</span>
                </button>
              </div>
            </div>
          </section>

          {/* VISUAL ANALYTICS: SPENDING BREAKDOWN & CASHFLOW BARS */}
          <section className="flex flex-col space-y-space-md" aria-label="Análisis visual">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  donut_large
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Financial Health &amp; Split
                </h2>
              </div>
              <button
                type="button"
                onClick={() => triggerAction('Monthly View')}
                className="font-label-sm text-label-sm text-primary hover:underline focus:outline-none"
              >
                Monthly View
              </button>
            </div>

            {/* Spending Breakdown Donut Card */}
            <div className="flex flex-col space-y-space-md rounded-xl bg-surface-container-low p-space-md shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-body-md text-body-md font-semibold text-on-surface">
                  Spending Allocation
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Apr 2025</span>
              </div>
              <div className="flex items-center justify-between gap-space-md">
                {/* SVG Donut Visualizer */}
                <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                  <svg
                    className="h-full w-full -rotate-90 transform"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#212c2e"
                      strokeWidth="12"
                    />
                    <circle
                      className="transition-all duration-500"
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#4cd7f6"
                      strokeDasharray="90.73 238.76"
                      strokeDashoffset="0"
                      strokeWidth="12"
                    />
                    <circle
                      className="transition-all duration-500"
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#4edea3"
                      strokeDasharray="52.53 238.76"
                      strokeDashoffset="-90.73"
                      strokeWidth="12"
                    />
                    <circle
                      className="transition-all duration-500"
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#d0bcff"
                      strokeDasharray="42.98 238.76"
                      strokeDashoffset="-143.26"
                      strokeWidth="12"
                    />
                    <circle
                      className="transition-all duration-500"
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#ffb4ab"
                      strokeDasharray="33.43 238.76"
                      strokeDashoffset="-186.24"
                      strokeWidth="12"
                    />
                    <circle
                      className="transition-all duration-500"
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#acedff"
                      strokeDasharray="19.1 238.76"
                      strokeDashoffset="-219.67"
                      strokeWidth="12"
                    />
                  </svg>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Total</span>
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      $8,430
                    </span>
                  </div>
                </div>

                {/* Legend Categorization Split */}
                <div className="flex min-w-0 flex-1 flex-col space-y-1.5">
                  <div className="flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                      <span className="font-label-sm text-label-sm truncate text-on-surface-variant">
                        Housing
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        $3,203
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">38%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span className="font-label-sm text-label-sm truncate text-on-surface-variant">
                        Services
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        $1,855
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">22%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-tertiary" />
                      <span className="font-label-sm text-label-sm truncate text-on-surface-variant">
                        Groceries
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        $1,517
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">18%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-error" />
                      <span className="font-label-sm text-label-sm truncate text-on-surface-variant">
                        Dining
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        $1,180
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">14%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-secondary-fixed" />
                      <span className="font-label-sm text-label-sm truncate text-on-surface-variant">
                        Savings
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-1">
                      <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                        $675
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6-Month Income vs Expense Bar Chart Card */}
            <div className="flex flex-col space-y-space-md rounded-xl bg-surface-container-low p-space-md shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-body-md text-body-md block font-semibold text-on-surface">
                    Cashflow Trajectory
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    6-Month historical income &amp; outflow
                  </span>
                </div>
                <div className="flex items-center gap-space-sm text-[11px]">
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>In</span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="h-2 w-2 rounded-full bg-error" />
                    <span>Out</span>
                  </div>
                </div>
              </div>

              {/* Bar Graphic Chart */}
              <div className="grid h-36 grid-cols-6 items-end gap-2 pt-2">
                {BAR_CHART_MONTHS.map(({ month, inH, outH, active }) => (
                  <div
                    key={month}
                    className={`flex h-full flex-col items-center justify-end gap-1 ${
                      active ? 'rounded bg-surface-container p-0.5' : ''
                    }`}
                  >
                    <div className="flex h-28 w-full items-end justify-center gap-1">
                      <div
                        className={`bg-primary rounded-t-sm ${
                          active
                            ? 'w-2.5 shadow-[0_0_8px_rgba(78,222,163,0.5)]'
                            : 'w-2'
                        }`}
                        style={{ height: inH }}
                      />
                      <div
                        className={`bg-error rounded-t-sm ${active ? 'w-2.5' : 'w-2'}`}
                        style={{ height: outH }}
                      />
                    </div>
                    <span
                      className={`font-label-sm text-label-sm ${
                        active
                          ? 'font-semibold text-primary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {month}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-container px-3 py-2 text-xs">
                <span className="text-on-surface-variant">Current Margin Delta</span>
                <span className="font-numeral-md text-numeral-md font-semibold text-primary">
                  +$6,420.00 Surplus
                </span>
              </div>
            </div>
          </section>

          {/* ARTICLE & PRICE COMPARISONS / DEAL TRACKER */}
          <section className="flex flex-col space-y-space-md" aria-label="Rastreador de precios">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-secondary">
                  price_check
                </span>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    Smart Price Tracker
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Optimal purchase arbitrage
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerAction('Track Item')}
                className="font-label-sm text-label-sm flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface transition-colors hover:text-primary focus:outline-none"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Track Item</span>
              </button>
            </div>

            {DEALS.map((deal) => (
              <div
                key={deal.id}
                className="flex flex-col space-y-space-sm rounded-xl bg-surface-container-low p-space-md shadow-md"
              >
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface">
                      <span className="material-symbols-outlined text-[24px]">
                        {deal.icon}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-body-md text-body-md truncate font-semibold text-on-surface">
                        {deal.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {deal.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm inline-flex shrink-0 items-center rounded-full bg-primary/15 px-2 py-0.5 font-semibold text-primary">
                    {deal.savings}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-numeral-lg text-numeral-lg text-primary">
                      {deal.price}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant line-through">
                      {deal.originalPrice}
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">
                    {deal.discount}
                  </span>
                </div>

                {deal.retailers.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {deal.retailers.map((ret) => (
                      <div
                        key={ret.name}
                        className={`flex flex-col items-center rounded p-1.5 text-center ${
                          ret.lowest
                            ? 'bg-primary/10'
                            : 'bg-surface-container'
                        }`}
                      >
                        <span
                          className={`font-label-sm text-label-sm ${
                            ret.lowest
                              ? 'font-semibold text-primary'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {ret.name}
                        </span>
                        <span
                          className={`font-label-sm text-label-sm ${
                            ret.lowest ? 'text-primary' : 'text-on-surface'
                          }`}
                        >
                          {ret.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {deal.badgeText && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        verified
                      </span>
                      <span>{deal.badgeText}</span>
                    </div>
                    {deal.hasAlert && (
                      <button
                        type="button"
                        onClick={() => triggerAction(`Alerta para ${deal.title}`)}
                        className="font-label-sm text-label-sm inline-flex items-center gap-1 font-semibold text-secondary hover:underline focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          notifications_active
                        </span>
                        <span>Alert</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* RECENT ACTIVITY LEDGER */}
          <section
            id="recent-activity-section"
            className="flex flex-col space-y-space-md"
            aria-label="Actividad reciente"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  history_edu
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Recent Activity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => triggerAction('Ver todas las transacciones')}
                className="font-label-sm text-label-sm text-primary hover:underline focus:outline-none"
              >
                View All
              </button>
            </div>

            {/* Filter Toggle Pills */}
            <div
              id="filter-tabs"
              role="tablist"
              aria-label="Filtro de transacciones"
              className="flex gap-1 rounded-lg bg-surface-container-low p-1"
            >
              <button
                id="filter-tab-all"
                role="tab"
                aria-selected={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                type="button"
                className={`filter-btn font-label-sm text-label-sm flex-1 rounded-md py-1.5 text-center transition-colors focus:outline-none ${
                  activeFilter === 'all'
                    ? 'bg-surface-container-highest font-semibold text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All
              </button>
              <button
                id="filter-tab-income"
                role="tab"
                aria-selected={activeFilter === 'income'}
                onClick={() => setActiveFilter('income')}
                type="button"
                className={`filter-btn font-label-sm text-label-sm flex-1 rounded-md py-1.5 text-center transition-colors focus:outline-none ${
                  activeFilter === 'income'
                    ? 'bg-surface-container-highest font-semibold text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Incomes
              </button>
              <button
                id="filter-tab-expense"
                role="tab"
                aria-selected={activeFilter === 'expense'}
                onClick={() => setActiveFilter('expense')}
                type="button"
                className={`filter-btn font-label-sm text-label-sm flex-1 rounded-md py-1.5 text-center transition-colors focus:outline-none ${
                  activeFilter === 'expense'
                    ? 'bg-surface-container-highest font-semibold text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Expenses
              </button>
            </div>

            {/* Transaction List */}
            <div className="flex flex-col space-y-2" id="tx-container">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  data-type={tx.type}
                  className="tx-item flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
                >
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tx.iconBg} ${tx.iconColor}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {tx.icon}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-body-md text-body-md truncate font-semibold text-on-surface">
                        {tx.title}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {tx.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span
                      className={`font-numeral-md text-numeral-md font-semibold ${tx.amountColor}`}
                    >
                      {tx.amount}
                    </span>
                    <span
                      className={`font-label-sm text-label-sm ${
                        tx.statusColor ?? 'text-on-surface-variant'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
  );
}
