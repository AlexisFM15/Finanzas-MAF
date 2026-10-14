import type { Account, Budget, Category, Goal, Transaction } from '@/domain/models';
import type { AppRepository, BackupData } from './repository';

export function getDemoSeedData(): BackupData {
  const accounts: Account[] = [
    {
      id: 'acc-checking',
      name: 'Banco BHD — Corriente',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 4215000, // $42,150.00 DOP
      institution: 'Banco BHD',
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-credit-card',
      name: 'Banco Popular — Visa Infinite',
      type: 'credit_card',
      currency: 'DOP',
      openingBalance: -129400, // -$1,294.00 DOP (Apple Retail Store + Figma)
      creditLimit: 20000000, // $200,000.00 DOP
      institution: 'Banco Popular Dominicano',
      color: '#4cd7f6',
      archived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-savings',
      name: 'Banreservas — Cuenta de Ahorro',
      type: 'savings',
      currency: 'DOP',
      openingBalance: 4000000, // $40,000.00 DOP
      institution: 'Banreservas',
      color: '#acedff',
      archived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-cash',
      name: 'Billetera Efectivo',
      type: 'cash',
      currency: 'DOP',
      openingBalance: 250000, // $2,500.00 DOP
      color: '#d0bcff',
      archived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'acc-loan-auto',
      name: 'Préstamo Vehículo',
      type: 'loan',
      currency: 'DOP',
      openingBalance: -3500000, // -$35,000.00 DOP
      loan: {
        principal: 5000000,
        annualRate: 0.12,
        termMonths: 36,
        startDate: '2025-06-01',
      },
      institution: 'Banco BHD',
      color: '#ffb4ab',
      archived: false,
      createdAt: '2025-06-01T00:00:00.000Z',
    },
    {
      id: 'acc-vanguard-usd',
      name: 'Vanguard Brokerage ETF',
      type: 'savings',
      currency: 'USD',
      openingBalance: 1500000, // $15,000.00 USD
      institution: 'Vanguard',
      color: '#4cd7f6',
      archived: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const categories: Category[] = [
    // Ingresos
    {
      id: 'cat-payroll',
      name: 'Nómina y Sueldos',
      kind: 'income',
      icon: 'account_balance',
      color: '#4edea3',
      keywords: ['sueldo', 'nomina', 'salario', 'empresa'],
    },
    {
      id: 'cat-freelance',
      name: 'Honorarios y Freelance',
      kind: 'income',
      icon: 'payments',
      color: '#4edea3',
      keywords: ['stripe', 'freelance', 'retainer', 'payout', 'cliente'],
    },
    {
      id: 'cat-dividends',
      name: 'Dividendos e Inversiones',
      kind: 'income',
      icon: 'savings',
      color: '#acedff',
      keywords: ['vanguard', 'dividendo', 'yield', 'vti', 'interes'],
    },
    // Gastos
    {
      id: 'cat-housing',
      name: 'Vivienda y Alquiler',
      kind: 'expense',
      icon: 'home',
      color: '#4cd7f6',
      keywords: ['alquiler', 'renta', 'mantenimiento', 'condominio'],
    },
    {
      id: 'cat-services',
      name: 'Servicios y Suscripciones',
      kind: 'expense',
      icon: 'category',
      color: '#4edea3',
      keywords: ['luz', 'agua', 'internet', 'figma', 'spotify', 'netflix', 'claro'],
    },
    {
      id: 'cat-groceries',
      name: 'Supermercado y Alimentos',
      kind: 'expense',
      icon: 'shopping_basket',
      color: '#d0bcff',
      keywords: ['super', 'whole foods', 'sirena', 'nacional', 'bravo', 'market'],
    },
    {
      id: 'cat-dining',
      name: 'Restaurantes y Cafeterías',
      kind: 'expense',
      icon: 'restaurant',
      color: '#ffb4ab',
      keywords: ['restaurante', 'cafe', 'bar', 'cena', 'almuerzo', 'uber eats'],
    },
    {
      id: 'cat-tech',
      name: 'Tecnología y Gadgets',
      kind: 'expense',
      icon: 'storefront',
      color: '#4cd7f6',
      keywords: ['apple', 'amazon', 'bestbuy', 'tech', 'gadget', 'hardware'],
    },
  ];

  const transactions: Transaction[] = [
    // 5 transacciones del Dashboard Stitch
    {
      id: 'tx-stitch-1',
      type: 'income',
      accountId: 'acc-checking',
      amount: 385000, // $3,850.00 DOP
      date: '2026-04-22',
      description: 'Stripe Payout',
      categoryId: 'cat-freelance',
      notes: 'Freelance Retainer • Cleared',
      createdAt: '2026-04-22T09:41:00.000Z',
      updatedAt: '2026-04-22T09:41:00.000Z',
    },
    {
      id: 'tx-stitch-2',
      type: 'expense',
      accountId: 'acc-credit-card',
      amount: 124900, // $1,249.00 DOP
      date: '2026-04-21',
      description: 'Apple Retail Store',
      categoryId: 'cat-tech',
      notes: 'Apple Pay • Tech & Gadgets',
      createdAt: '2026-04-21T15:20:00.000Z',
      updatedAt: '2026-04-21T15:20:00.000Z',
    },
    {
      id: 'tx-stitch-3',
      type: 'income',
      accountId: 'acc-checking',
      amount: 41250, // $412.50 DOP
      date: '2026-04-21',
      description: 'Vanguard Dividend Yield',
      categoryId: 'cat-dividends',
      notes: 'VTI Index ETF • Reinvested',
      createdAt: '2026-04-21T11:00:00.000Z',
      updatedAt: '2026-04-21T11:00:00.000Z',
    },
    {
      id: 'tx-stitch-4',
      type: 'expense',
      accountId: 'acc-checking',
      amount: 16840, // $168.40 DOP
      date: '2026-04-19',
      description: 'Whole Foods Market',
      categoryId: 'cat-groceries',
      notes: 'Debit Card • Organic Groceries',
      createdAt: '2026-04-19T18:30:00.000Z',
      updatedAt: '2026-04-19T18:30:00.000Z',
    },
    {
      id: 'tx-stitch-5',
      type: 'expense',
      accountId: 'acc-credit-card',
      amount: 4500, // $45.00 DOP
      date: '2026-04-18',
      description: 'Figma Enterprise',
      categoryId: 'cat-services',
      notes: 'Auto Renew • Recurring Sub',
      createdAt: '2026-04-18T08:00:00.000Z',
      updatedAt: '2026-04-18T08:00:00.000Z',
    },
    // Histórico de ingresos y gastos de meses anteriores para alimentar gráficos
    {
      id: 'tx-hist-mar-sal',
      type: 'income',
      accountId: 'acc-checking',
      amount: 1485000,
      date: '2026-03-30',
      description: 'Nómina Mensual',
      categoryId: 'cat-payroll',
      createdAt: '2026-03-30T10:00:00.000Z',
      updatedAt: '2026-03-30T10:00:00.000Z',
    },
    {
      id: 'tx-hist-mar-rent',
      type: 'expense',
      accountId: 'acc-checking',
      amount: 320300,
      date: '2026-03-05',
      description: 'Alquiler Apartamento',
      categoryId: 'cat-housing',
      createdAt: '2026-03-05T09:00:00.000Z',
      updatedAt: '2026-03-05T09:00:00.000Z',
    },
    {
      id: 'tx-hist-mar-groc',
      type: 'expense',
      accountId: 'acc-checking',
      amount: 151700,
      date: '2026-03-12',
      description: 'Supermercado Nacional',
      categoryId: 'cat-groceries',
      createdAt: '2026-03-12T14:00:00.000Z',
      updatedAt: '2026-03-12T14:00:00.000Z',
    },
    {
      id: 'tx-hist-feb-sal',
      type: 'income',
      accountId: 'acc-checking',
      amount: 1485000,
      date: '2026-02-28',
      description: 'Nómina Mensual',
      categoryId: 'cat-payroll',
      createdAt: '2026-02-28T10:00:00.000Z',
      updatedAt: '2026-02-28T10:00:00.000Z',
    },
    {
      id: 'tx-hist-feb-rent',
      type: 'expense',
      accountId: 'acc-checking',
      amount: 320300,
      date: '2026-02-05',
      description: 'Alquiler Apartamento',
      categoryId: 'cat-housing',
      createdAt: '2026-02-05T09:00:00.000Z',
      updatedAt: '2026-02-05T09:00:00.000Z',
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'b-housing',
      categoryId: 'cat-housing',
      monthlyLimit: 3500000, // $35,000.00 DOP
      alertThreshold: 0.85,
      startMonth: '2026-01',
    },
    {
      id: 'b-groceries',
      categoryId: 'cat-groceries',
      monthlyLimit: 2000000, // $20,000.00 DOP
      alertThreshold: 0.8,
      startMonth: '2026-01',
    },
    {
      id: 'b-services',
      categoryId: 'cat-services',
      monthlyLimit: 1000000, // $10,000.00 DOP
      alertThreshold: 0.8,
      startMonth: '2026-01',
    },
  ];

  const goals: Goal[] = [
    {
      id: 'g-emergency',
      name: 'Fondo de Emergencia (6 meses)',
      targetAmount: 25000000, // $250,000.00 DOP
      linkedAccountId: 'acc-savings',
      deadline: '2026-12-31',
    },
    {
      id: 'g-vacations',
      name: 'Vacaciones Fin de Año',
      targetAmount: 6000000, // $60,000.00 DOP
      manualAmount: 2500000, // $25,000.00 DOP
      deadline: '2026-11-30',
    },
  ];

  return {
    version: 1,
    exportedAt: '2026-04-22T10:00:00.000Z',
    accounts,
    categories,
    transactions,
    budgets,
    goals,
  };
}

export async function seedDemoData(
  repo: AppRepository,
  options?: { force?: boolean }
): Promise<boolean> {
  if (!options?.force) {
    const existingAccounts = await repo.accounts.getAll();
    if (existingAccounts.length > 0) {
      return false; // Idempotente: ya tiene datos y no se forzó reescritura
    }
  }

  const demoData = getDemoSeedData();
  await repo.importJSON(demoData, 'replace');
  return true;
}
