# Fase 5: Módulo de Transacciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el módulo completo de Transacciones (`Transactions`) con tabla/lista agrupada por fechas, filtros avanzados (búsqueda, tipo, cuenta, categoría, rango de fechas e importes), modal de creación/edición con autocategorización inteligente en tiempo real y soporte completo para transferencias entre cuentas.

**Architecture:** Se implementa `useTransactionsStore` en Zustand que orquesta la persistencia con `AppRepository` (IndexedDB y memoria), integrando las funciones de dominio puras `filterTransactions`, `sortTransactions`, `suggestCategory`, `accountBalance` y `formatMoney`. Los componentes en `src/features/transactions/` componen la interfaz con estética Google Stitch dark.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand v5, Lucide React, Vitest, Testing Library, Dexie.js (IndexedDB).

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§3, §5, §6 Fase 5).

## Global Constraints

- **Regla Monetaria Central:** Todos los importes financieros se guardan como enteros positivos en céntimos (`Cents`). Prohibido el uso de `float` en cálculos de dominio. El formateo se realiza exclusivamente con `Intl.NumberFormat` vía `formatMoney`.
- **Pureza de Dominio:** Ningún componente de `src/domain/` debe importar de React, Dexie, React Router ni del DOM.
- **Estética Google Stitch Dark:** Colores `--color-surface` (`#0a1517`), `--color-surface-container` (`#162123`), `--color-primary` (`#4edea3`), `--color-error` (`#ffb4ab`), `--color-transfer` (`#4cd7f6`), texto `--color-on-surface` (`#d9e5e7`).
- **Accesibilidad y Móvil:** Touch targets mínimos de 44px, espaciado inferior seguro (`pb-safe`), navegación accesible por teclado y roles ARIA.
- **Offline-First:** Persistencia en IndexedDB mediante `TransactionRepository`, reactividad automática e inicialización de seed si la base de datos está vacía.

## Review Focus

1. **Validación de transferencias entre cuentas:** Si el tipo es `transfer`, la cuenta de destino `toAccountId` es obligatoria y debe ser estrictamente distinta de `accountId`. El formulario debe prevenir transferencias hacia la misma cuenta con un mensaje claro.
2. **Autocategorización no invasiva:** La sugerencia automática de categorías (`suggestCategory`) debe reaccionar mientras el usuario escribe la descripción sin pisar una selección manual explícita del usuario.
3. **Monto estrictamente positivo en modelo:** `Transaction.amount` en el modelo de dominio siempre es `> 0`. El signo visual (`+` en verde para ingresos, `-` en rojo para gastos) es exclusivo de presentación.
4. **Diferenciación entre sin datos y sin coincidencias de filtro:** Una base de datos sin transacciones muestra la llamada a la acción para crear la primera transacción, mientras que un filtro sin resultados ofrece un botón visible para limpiar los filtros.
5. **Agrupación y ordenamiento por fecha:** Las transacciones deben ordenarse de forma estable (descendente por fecha, desempate por `createdAt` e `id`) y agruparse visualmente por fecha para una lectura fluida.

---

### Task 1: Transactions State Management (`src/state/useTransactionsStore.ts`)

**Files:**
- Create: `src/state/useTransactionsStore.ts`
- Test: `src/state/useTransactionsStore.test.ts`

**Interfaces:**
- Consumes: `AppRepository`, `Transaction`, `Account`, `Category`, `CreateTransactionDTO`, `UpdateTransactionDTO`, `TransactionFilter`, `TransactionSort`, `filterTransactions`, `sortTransactions`.
- Produces:
  ```typescript
  export interface TransactionsState {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    filter: TransactionFilter;
    sort: TransactionSort;
    loadData: (repo?: AppRepository) => Promise<void>;
    createTransaction: (dto: CreateTransactionDTO, repo?: AppRepository) => Promise<Transaction>;
    updateTransaction: (id: ID, dto: UpdateTransactionDTO, repo?: AppRepository) => Promise<Transaction>;
    deleteTransaction: (id: ID, repo?: AppRepository) => Promise<void>;
    setFilter: (filter: Partial<TransactionFilter>) => void;
    resetFilter: () => void;
    setSort: (sort: TransactionSort) => void;
    getFilteredTransactions: () => Transaction[];
  }
  export const useTransactionsStore: UseBoundStore<StoreApi<TransactionsState>>;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// src/state/useTransactionsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTransactionsStore } from './useTransactionsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';

describe('useTransactionsStore', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
    useTransactionsStore.setState({
      transactions: [],
      accounts: [],
      categories: [],
      isLoading: false,
      error: null,
      filter: {},
      sort: { by: 'date', direction: 'desc' },
    });
  });

  it('loads transactions, accounts, and categories from repository, seeding if empty', async () => {
    await useTransactionsStore.getState().loadData(repo);
    const state = useTransactionsStore.getState();
    expect(state.transactions.length).toBeGreaterThan(0);
    expect(state.accounts.length).toBeGreaterThan(0);
    expect(state.categories.length).toBeGreaterThan(0);
  });

  it('creates a transaction and adds it to the store', async () => {
    await useTransactionsStore.getState().loadData(repo);
    const account = useTransactionsStore.getState().accounts[0]!;

    const newTx = await useTransactionsStore.getState().createTransaction(
      {
        type: 'expense',
        accountId: account.id,
        amount: 50000,
        date: '2026-02-01',
        description: 'Supermercado Nacional',
        categoryId: null,
      },
      repo,
    );

    expect(newTx.id).toBeDefined();
    expect(useTransactionsStore.getState().transactions.some((t) => t.id === newTx.id)).toBe(true);
  });

  it('filters and sorts transactions according to filter state', async () => {
    await useTransactionsStore.getState().loadData(repo);

    useTransactionsStore.getState().setFilter({ types: ['income'] });
    const filtered = useTransactionsStore.getState().getFilteredTransactions();

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.type === 'income')).toBe(true);

    useTransactionsStore.getState().resetFilter();
    expect(useTransactionsStore.getState().getFilteredTransactions().length).toBe(
      useTransactionsStore.getState().transactions.length,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/useTransactionsStore.test.ts`
Expected: FAIL with "Cannot find module './useTransactionsStore'".

- [ ] **Step 3: Implement `useTransactionsStore` in `src/state/useTransactionsStore.ts`**

Implement Zustand store connecting with `AppRepository`, handling auto-seed on initial load when accounts/transactions are empty, managing reactive filter and sort state, and delegating filtering to `filterTransactions` and `sortTransactions`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/useTransactionsStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useTransactionsStore.ts src/state/useTransactionsStore.test.ts
git commit -m "feat(transactions): add useTransactionsStore with reactive filtering and persistence"
```

---

### Task 2: Transaction Filters Bar (`src/features/transactions/components/TransactionFiltersBar.tsx`)

**Files:**
- Create: `src/features/transactions/components/TransactionFiltersBar.tsx`
- Test: `src/features/transactions/components/TransactionFiltersBar.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface TransactionFiltersBarProps {
    filter: TransactionFilter;
    accounts: readonly Account[];
    categories: readonly Category[];
    onFilterChange: (partial: Partial<TransactionFilter>) => void;
    onResetFilter: () => void;
  }
  ```
- Produces: Search bar, quick type tabs (Todas, Ingresos, Gastos, Transferencias), account filter select, category filter select, date range filter inputs, and "Limpiar filtros" action button.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/transactions/components/TransactionFiltersBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionFiltersBar } from './TransactionFiltersBar';

describe('TransactionFiltersBar', () => {
  it('triggers search update on input', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFiltersBar
        filter={{}}
        accounts={[]}
        categories={[]}
        onFilterChange={onFilterChange}
        onResetFilter={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/buscar transacciones/i);
    fireEvent.change(searchInput, { target: { value: 'Stripe' } });

    expect(onFilterChange).toHaveBeenCalledWith({ search: 'Stripe' });
  });

  it('triggers type filter when clicking Incomes tab', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFiltersBar
        filter={{}}
        accounts={[]}
        categories={[]}
        onFilterChange={onFilterChange}
        onResetFilter={vi.fn()}
      />,
    );

    const incomeTab = screen.getByRole('tab', { name: /ingresos/i });
    fireEvent.click(incomeTab);

    expect(onFilterChange).toHaveBeenCalledWith({ types: ['income'] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/transactions/components/TransactionFiltersBar.test.tsx`
Expected: FAIL with "Cannot find module './TransactionFiltersBar'".

- [ ] **Step 3: Implement `TransactionFiltersBar` in `src/features/transactions/components/TransactionFiltersBar.tsx`**

Implement component with type pills, search input with clear icon, account and category dropdowns, date picker controls, and active filter counter with reset button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/transactions/components/TransactionFiltersBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/components/TransactionFiltersBar.tsx src/features/transactions/components/TransactionFiltersBar.test.tsx
git commit -m "feat(transactions): add TransactionFiltersBar with search, type tabs and category filters"
```

---

### Task 3: Transaction Item Component (`src/features/transactions/components/TransactionItem.tsx`)

**Files:**
- Create: `src/features/transactions/components/TransactionItem.tsx`
- Test: `src/features/transactions/components/TransactionItem.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface TransactionItemProps {
    transaction: Transaction;
    account?: Account;
    toAccount?: Account;
    category?: Category;
    onEdit: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
  }
  ```
- Produces: Visual row/card representing an individual transaction displaying:
  - Icon: category icon or directional arrow (income: green up-right, expense: red down-right, transfer: blue horizontal).
  - Description and optional notes.
  - Category badge with color indicator.
  - Account name (or `Origen → Destino` for transfers).
  - Date.
  - Formatted amount (+green, -red, blue).
  - Action buttons: Edit and Delete.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/transactions/components/TransactionItem.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionItem } from './TransactionItem';
import type { Transaction, Account, Category } from '@/domain/models';

describe('TransactionItem', () => {
  const mockTx: Transaction = {
    id: 'tx-1',
    type: 'expense',
    accountId: 'acc-1',
    amount: 250000,
    date: '2026-02-15',
    description: 'Compra Supermercado',
    categoryId: 'cat-food',
    createdAt: '2026-02-15T12:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z',
  };

  const mockAccount: Account = {
    id: 'acc-1',
    name: 'Banco BHD',
    type: 'checking',
    currency: 'DOP',
    openingBalance: 100000,
    color: '#4edea3',
    archived: false,
    createdAt: '2026-01-01',
  };

  const mockCategory: Category = {
    id: 'cat-food',
    name: 'Alimentación',
    kind: 'expense',
    icon: 'shopping-cart',
    color: '#ffb4ab',
    keywords: ['supermercado'],
  };

  it('renders transaction description, formatted expense amount and category', () => {
    render(
      <TransactionItem
        transaction={mockTx}
        account={mockAccount}
        category={mockCategory}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Compra Supermercado')).toBeInTheDocument();
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Banco BHD')).toBeInTheDocument();
    expect(screen.getByText(/2500,00|2\.500,00/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/transactions/components/TransactionItem.test.tsx`
Expected: FAIL with "Cannot find module './TransactionItem'".

- [ ] **Step 3: Implement `TransactionItem` in `src/features/transactions/components/TransactionItem.tsx`**

Implement component with Stitch styling, direction icon, formatted amount, category badge, date, and actions triggers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/transactions/components/TransactionItem.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/components/TransactionItem.tsx src/features/transactions/components/TransactionItem.test.tsx
git commit -m "feat(transactions): add TransactionItem component with directional badges and actions"
```

---

### Task 4: Transaction Summary Bar (`src/features/transactions/components/TransactionSummaryBar.tsx`)

**Files:**
- Create: `src/features/transactions/components/TransactionSummaryBar.tsx`
- Test: `src/features/transactions/components/TransactionSummaryBar.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface TransactionSummaryBarProps {
    transactions: readonly Transaction[];
    currency?: CurrencyCode;
  }
  ```
- Produces: Header summary pill/bar showing:
  - Total Ingresos (sum of income transactions in cents).
  - Total Gastos (sum of expense transactions in cents).
  - Balance Neto (Ingresos - Gastos).
  - Conteo total de transacciones visibles.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/transactions/components/TransactionSummaryBar.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransactionSummaryBar } from './TransactionSummaryBar';
import type { Transaction } from '@/domain/models';

describe('TransactionSummaryBar', () => {
  const txs: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      accountId: 'acc-1',
      amount: 100000, // 1,000 DOP
      date: '2026-02-01',
      description: 'Salario',
      categoryId: null,
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 40000, // 400 DOP
      date: '2026-02-02',
      description: 'Comida',
      categoryId: null,
      createdAt: '2026-02-02',
      updatedAt: '2026-02-02',
    },
  ];

  it('renders income, expense and net totals accurately', () => {
    render(<TransactionSummaryBar transactions={txs} currency="DOP" />);

    expect(screen.getByText(/ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/gastos/i)).toBeInTheDocument();
    expect(screen.getByText(/balance neto/i)).toBeInTheDocument();

    // 1000 income, 400 expense, 600 net
    expect(screen.getByText(/1000,00|1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/400,00/)).toBeInTheDocument();
    expect(screen.getByText(/600,00/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/transactions/components/TransactionSummaryBar.test.tsx`
Expected: FAIL with "Cannot find module './TransactionSummaryBar'".

- [ ] **Step 3: Implement `TransactionSummaryBar` in `src/features/transactions/components/TransactionSummaryBar.tsx`**

Implement component calculating sum of incomes, sum of expenses, and net balance, styled with Stitch tokens.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/transactions/components/TransactionSummaryBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/components/TransactionSummaryBar.tsx src/features/transactions/components/TransactionSummaryBar.test.tsx
git commit -m "feat(transactions): add TransactionSummaryBar with income, expense and net totals"
```

---

### Task 5: Transaction Create/Edit Modal with Smart Autocategorization (`src/features/transactions/components/TransactionFormModal.tsx`)

**Files:**
- Create: `src/features/transactions/components/TransactionFormModal.tsx`
- Test: `src/features/transactions/components/TransactionFormModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface TransactionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: readonly Account[];
    categories: readonly Category[];
    transactionToEdit?: Transaction | null;
    onSubmit: (dto: CreateTransactionDTO | UpdateTransactionDTO) => Promise<void>;
  }
  ```
- Uses: `parseMoney`, `suggestCategory`, `normalizeText`.
- Produces: Modal with inputs:
  - Tipo: Ingreso / Gasto / Transferencia.
  - Cuenta origen: `accountId`.
  - Cuenta destino: `toAccountId` (solo si tipo es transferencia; validada para que sea != origen).
  - Monto: string parseado a `Cents` (> 0).
  - Fecha: `ISODate`.
  - Descripción: texto. Al escribir, ejecuta `suggestCategory` y sugiere automáticamente la categoría correspondiente si el usuario no ha forzado una manualmente.
  - Categoría: selector de categorías disponibles (oculto en transferencias).
  - Notas: opcional.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/transactions/components/TransactionFormModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionFormModal } from './TransactionFormModal';
import type { Account, Category } from '@/domain/models';

describe('TransactionFormModal', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Banco BHD',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 100000,
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      name: 'Efectivo',
      type: 'cash',
      currency: 'DOP',
      openingBalance: 50000,
      color: '#d0bcff',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-food',
      name: 'Comida y Restaurantes',
      kind: 'expense',
      icon: 'utensils',
      color: '#ffb4ab',
      keywords: ['restaurante', 'pizza', 'uber eats'],
    },
  ];

  it('autocategorizes expense when typing matching keyword in description', async () => {
    render(
      <TransactionFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={vi.fn()}
      />,
    );

    const descInput = screen.getByLabelText(/descripción/i);
    fireEvent.change(descInput, { target: { value: 'Cena pizza con amigos' } });

    // Should automatically select Comida y Restaurantes
    const catSelect = screen.getByLabelText(/categoría/i) as HTMLSelectElement;
    expect(catSelect.value).toBe('cat-food');
  });

  it('validates that transfer origin and destination are different', async () => {
    render(
      <TransactionFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        onSubmit={vi.fn()}
      />,
    );

    const typeSelect = screen.getByLabelText(/tipo/i);
    fireEvent.change(typeSelect, { target: { value: 'transfer' } });

    // Origin and destination set to same account
    const fromSelect = screen.getByLabelText(/cuenta de origen/i);
    const toSelect = screen.getByLabelText(/cuenta de destino/i);
    fireEvent.change(fromSelect, { target: { value: 'acc-1' } });
    fireEvent.change(toSelect, { target: { value: 'acc-1' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/la cuenta de destino debe ser diferente/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/transactions/components/TransactionFormModal.test.tsx`
Expected: FAIL with "Cannot find module './TransactionFormModal'".

- [ ] **Step 3: Implement `TransactionFormModal` in `src/features/transactions/components/TransactionFormModal.tsx`**

Implement modal dialog with conditional fields, live autocategorization via `suggestCategory`, transfer account distinction validation, and `parseMoney` conversion.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/transactions/components/TransactionFormModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/components/TransactionFormModal.tsx src/features/transactions/components/TransactionFormModal.test.tsx
git commit -m "feat(transactions): add TransactionFormModal with real-time autocategorization and transfer validation"
```

---

### Task 6: TransactionsPage Integration (`src/features/transactions/TransactionsPage.tsx`)

**Files:**
- Modify: `src/features/transactions/TransactionsPage.tsx`
- Test: `src/features/transactions/TransactionsPage.test.tsx`

**Interfaces:**
- Consumes: `useTransactionsStore`, `TransactionSummaryBar`, `TransactionFiltersBar`, `TransactionItem`, `TransactionFormModal`.
- Produces: Integrated `/transactions` page with:
  - Header with title, "Nueva Transacción" button, and reload.
  - `TransactionSummaryBar` with filtered totals.
  - `TransactionFiltersBar` with real-time controls.
  - Transactions grouped by Date (`Hoy`, `Ayer`, or formatted date).
  - Empty state with clear filters trigger or create first transaction.
  - Modals: create/edit and delete confirmation.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/transactions/TransactionsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionsPage } from './TransactionsPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useTransactionsStore } from '@/state/useTransactionsStore';

describe('TransactionsPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useTransactionsStore.getState().loadData(repo);
  });

  it('renders transactions list and summary from seed data', async () => {
    render(<TransactionsPage repo={repo} />);

    expect(await screen.findByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
    expect(screen.getByText(/balance neto/i)).toBeInTheDocument();
  });

  it('filters transactions by type pills', async () => {
    render(<TransactionsPage repo={repo} />);

    expect(await screen.findByText('Stripe Payout')).toBeInTheDocument();

    const expensesTab = screen.getByRole('tab', { name: /gastos/i });
    fireEvent.click(expensesTab);

    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();
    expect(screen.queryByText('Stripe Payout')).not.toBeInTheDocument();
  });

  it('opens new transaction modal when clicking Nueva Transacción button', async () => {
    render(<TransactionsPage repo={repo} />);

    const newBtn = await screen.findByRole('button', { name: /nueva transacción/i });
    fireEvent.click(newBtn);

    expect(await screen.findByRole('heading', { name: /nueva transacción/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/transactions/TransactionsPage.test.tsx`
Expected: FAIL because placeholder does not render seed transactions or filter bars.

- [ ] **Step 3: Implement `TransactionsPage` in `src/features/transactions/TransactionsPage.tsx`**

Replace placeholder in `TransactionsPage.tsx` with full integration connecting to `useTransactionsStore`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/transactions/TransactionsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/TransactionsPage.tsx src/features/transactions/TransactionsPage.test.tsx
git commit -m "feat(transactions): integrate full TransactionsPage with date grouping, filtering, and modals"
```

---

### Task 7: Full System Verification & PWA Build

**Files:**
- Verification only

- [ ] **Step 1: Run typecheck across entire project**

Run: `npm run typecheck`
Expected: Exited with code 0.

- [ ] **Step 2: Run full Vitest test suite**

Run: `npm test`
Expected: All test suites pass (100% pass rate).

- [ ] **Step 3: Run production PWA build**

Run: `npm run build`
Expected: Production bundle and service worker built successfully.
