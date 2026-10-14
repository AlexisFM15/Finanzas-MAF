// Modelos de dominio — copia literal del §5 del spec. Sin lógica.

export type ID = string; // crypto.randomUUID()
export type Cents = number; // Entero en céntimos
export type ISODate = string; // 'YYYY-MM-DD'
export type YearMonth = string; // 'YYYY-MM'
export type CurrencyCode = string; // ISO 4217 ('USD', 'EUR', etc.)

// ── Cuentas ────────────────────────────────────────────
export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'loan';

export interface Account {
  id: ID;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  openingBalance: Cents; // Deudas son negativas
  creditLimit?: Cents; // Exclusivo credit_card
  loan?: LoanTerms; // Exclusivo loan
  institution?: string;
  color: string;
  archived: boolean;
  createdAt: string;
}

export interface LoanTerms {
  principal: Cents;
  annualRate: number; // 0.12 = 12 %
  termMonths: number;
  startDate: ISODate;
}

// ── Transacciones ──────────────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: ID;
  type: TransactionType;
  accountId: ID;
  toAccountId?: ID; // Exclusivo transfer
  amount: Cents; // Siempre > 0
  date: ISODate;
  description: string;
  categoryId: ID | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: ID;
  name: string;
  kind: 'income' | 'expense';
  icon: string; // Icono Lucide
  color: string;
  keywords: string[]; // Autocategorización
}

// ── Presupuestos y Metas ───────────────────────────────
export interface Budget {
  id: ID;
  categoryId: ID;
  monthlyLimit: Cents;
  alertThreshold: number; // Default 0.8
  startMonth: YearMonth;
}

export type BudgetStatus = 'safe' | 'warning' | 'over';

export interface BudgetProgress {
  budget: Budget;
  month: YearMonth;
  spent: Cents;
  remaining: Cents;
  ratio: number;
  status: BudgetStatus;
}

export interface Goal {
  id: ID;
  name: string;
  targetAmount: Cents;
  linkedAccountId?: ID;
  manualAmount?: Cents;
  deadline?: ISODate;
}
