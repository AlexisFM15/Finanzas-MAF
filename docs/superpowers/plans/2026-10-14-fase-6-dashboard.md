# Fase 6: Dashboard & Gráficas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el módulo completo de Dashboard y visualizaciones financieras con diseño Stitch oscuro, métricas de patrimonio neto en tiempo real calculadas desde el dominio, gráficos interactivos con Recharts (comparativa mensual de ingresos/gastos y distribución por categorías), acciones rápidas conectadas a modales y lista de movimientos recientes con tabs reactivos.

**Architecture:** El Dashboard consume reactivamente `useAccountsStore` y `useTransactionsStore` alimentados desde la capa de persistencia offline (`AppRepository`). La lógica de cálculo monetario y series temporales reutiliza las funciones puras del dominio (`netWorthByCurrency`, `monthlySeries`, `monthlySummary`, `accountBalance`). La capa de presentación se descompone en componentes modulares (`HeroNetWorthCard`, `QuickActionsBar`, `IncomeExpenseChart`, `CategoryExpenseDonutChart`, `RecentTransactionsWidget`) orquestados en `DashboardPage` con estados de carga skeleton offline.

**Tech Stack:** React 19, TypeScript, Recharts 3, Zustand 5, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§3, §5, §6 Fase 6).

## Global Constraints

- Tipado estricto con `exactOptionalPropertyTypes: true` y 0 errores de TypeScript (`tsc -b`).
- Todos los montos se representan como enteros positivos en céntimos (`Cents`).
- Sin dependencias de UI en la capa `src/domain/`.
- Paleta visual Google Stitch: fondos oscuros profundos (`bg-surface`, `bg-surface-container-low`), acentos de aura translúcidos, tipografía Space Grotesk / Manrope, micro-animaciones y bordes sutiles.
- Responsive y mobile-first con áreas táctiles mínimas de 44x44px.
- Compatibilidad completa con renderizado offline y testeo en entorno jsdom.

## Review Focus

1. **Datos vacíos o primer arranque:** El Dashboard no debe fallar ni romper los gráficos si no hay transacciones o cuentas creadas (renderiza estados vacíos elegantes y gráficos con valores en cero).
2. **Cuentas en múltiples divisas:** `netWorthByCurrency` devuelve un mapa por divisa; el Dashboard debe mostrar el patrimonio en la divisa principal (`DOP`) y desglosar divisas secundarias si existen sin sumar montos de monedas distintas.
3. **Responsive en pantallas móviles:** En viewports pequeños (< 640px), los gráficos de Recharts deben autoajustarse fluidamente con `ResponsiveContainer` sin desbordamiento horizontal.
4. **Coherencia con las transacciones recientes:** Las pestañas *All*, *Incomes* y *Expenses* en el widget de movimientos deben filtrar en tiempo real los últimos movimientos.
5. **Acciones rápidas:** Los botones *Deposit funds*, *Transfer capital* y *Add expense* deben disparar el modal de transacción con el tipo preseleccionado (`income`, `transfer`, `expense`).

---

### Task 1: Setup ResizeObserver Mock in Test Environment (`src/test/setup.ts`)

**Files:**
- Modify: `src/test/setup.ts`

**Interfaces:**
- Produces: `globalThis.ResizeObserver` mock para evitar fallos de renderizado de Recharts `ResponsiveContainer` en entorno jsdom.

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/resize-observer.test.ts
import { describe, it, expect } from 'vitest';

describe('ResizeObserver Environment Setup', () => {
  it('has ResizeObserver defined globally in test environment', () => {
    expect(globalThis.ResizeObserver).toBeDefined();
    const ro = new ResizeObserver(() => {});
    expect(ro.observe).toBeTypeOf('function');
    expect(ro.disconnect).toBeTypeOf('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/resize-observer.test.ts`
Expected: FAIL if ResizeObserver is not defined in jsdom.

- [ ] **Step 3: Implement ResizeObserver polyfill in `src/test/setup.ts`**

Add class `ResizeObserverMock` to `src/test/setup.ts` and assign to `globalThis.ResizeObserver`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/resize-observer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/test/setup.ts src/test/resize-observer.test.ts
git commit -m "test(setup): add ResizeObserver mock for Recharts jsdom support"
```

---

### Task 2: Hero Net Worth Component (`src/features/dashboard/components/HeroNetWorthCard.tsx`)

**Files:**
- Create: `src/features/dashboard/components/HeroNetWorthCard.tsx`
- Test: `src/features/dashboard/components/HeroNetWorthCard.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface HeroNetWorthCardProps {
    accounts: readonly Account[];
    transactions: readonly Transaction[];
    isLoading?: boolean;
  }
  ```
- Uses: `netWorthByCurrency`, `formatMoney` de `@/domain/money` y `@/domain/balances`.
- Produces: Tarjeta hero Stitch con aura glow, saldo total en DOP, indicador de crecimiento mensual y badges de desglose si hay múltiples monedas.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/dashboard/components/HeroNetWorthCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroNetWorthCard } from './HeroNetWorthCard';
import type { Account, Transaction } from '@/domain/models';

describe('HeroNetWorthCard', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Banco BHD',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 5000000, // $50,000.00 DOP
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      name: 'Tarjeta Visa',
      type: 'credit_card',
      currency: 'DOP',
      openingBalance: -1000000, // -$10,000.00 DOP
      color: '#4cd7f6',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockTransactions: Transaction[] = [];

  it('renders net worth total calculated across accounts in DOP', () => {
    render(<HeroNetWorthCard accounts={mockAccounts} transactions={mockTransactions} />);

    expect(screen.getByText('Net Portfolio Worth')).toBeInTheDocument();
    expect(screen.getByText('$40,000.00')).toBeInTheDocument();
    expect(screen.getByText('DOP')).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    render(<HeroNetWorthCard accounts={[]} transactions={[]} isLoading={true} />);

    expect(screen.getByTestId('hero-net-worth-skeleton')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/HeroNetWorthCard.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `HeroNetWorthCard` in `src/features/dashboard/components/HeroNetWorthCard.tsx`**

Implement component with ambient glow decorations, `netWorthByCurrency` calculation, formatted money display, and skeleton loading state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/HeroNetWorthCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/HeroNetWorthCard.tsx src/features/dashboard/components/HeroNetWorthCard.test.tsx
git commit -m "feat(dashboard): add HeroNetWorthCard with real-time net worth computation and Stitch aura"
```

---

### Task 3: Quick Actions Bar (`src/features/dashboard/components/QuickActionsBar.tsx`)

**Files:**
- Create: `src/features/dashboard/components/QuickActionsBar.tsx`
- Test: `src/features/dashboard/components/QuickActionsBar.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface QuickActionsBarProps {
    onDeposit?: () => void;
    onTransfer?: () => void;
    onExpense?: () => void;
    onScanBill?: () => void;
  }
  ```
- Produces: Barra horizontal de 4 botones rápidos (*Deposit funds*, *Transfer capital*, *Add expense*, *Scan bill*) con iconografía Material Symbols / Lucide, diseño circular Stitch y accesibilidad ARIA completa.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/dashboard/components/QuickActionsBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickActionsBar } from './QuickActionsBar';

describe('QuickActionsBar', () => {
  it('renders all four action buttons with accessible labels', () => {
    render(<QuickActionsBar />);

    expect(screen.getByRole('button', { name: /deposit funds/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transfer capital/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan bill/i })).toBeInTheDocument();
  });

  it('triggers callbacks when buttons are clicked', () => {
    const onDeposit = vi.fn();
    const onTransfer = vi.fn();
    const onExpense = vi.fn();

    render(
      <QuickActionsBar
        onDeposit={onDeposit}
        onTransfer={onTransfer}
        onExpense={onExpense}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /deposit funds/i }));
    expect(onDeposit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /transfer capital/i }));
    expect(onTransfer).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /add expense/i }));
    expect(onExpense).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/QuickActionsBar.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `QuickActionsBar` in `src/features/dashboard/components/QuickActionsBar.tsx`**

Implement component with 4 circular action buttons, hover micro-interactions, and accessible tooltips/labels.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/QuickActionsBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/QuickActionsBar.tsx src/features/dashboard/components/QuickActionsBar.test.tsx
git commit -m "feat(dashboard): add QuickActionsBar with accessible triggers"
```

---

### Task 4: Income vs Expense Monthly Bar Chart (`src/features/dashboard/components/IncomeExpenseChart.tsx`)

**Files:**
- Create: `src/features/dashboard/components/IncomeExpenseChart.tsx`
- Test: `src/features/dashboard/components/IncomeExpenseChart.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface IncomeExpenseChartProps {
    transactions: readonly Transaction[];
    isLoading?: boolean;
  }
  ```
- Uses: `monthlySeries` de `@/domain/monthly`, Recharts `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`.
- Produces: Gráfica de barras comparativa de ingresos vs gastos en los últimos 6 meses con tooltips personalizados y colores Stitch (`#4edea3` y `#ffb4ab`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/dashboard/components/IncomeExpenseChart.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IncomeExpenseChart } from './IncomeExpenseChart';
import type { Transaction } from '@/domain/models';

describe('IncomeExpenseChart', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      accountId: 'acc-1',
      amount: 500000, // $5,000.00 DOP
      date: '2026-04-10',
      description: 'Salario',
      categoryId: 'cat-1',
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 200000, // $2,000.00 DOP
      date: '2026-04-15',
      description: 'Supermercado',
      categoryId: 'cat-2',
      createdAt: '2026-04-15T00:00:00.000Z',
      updatedAt: '2026-04-15T00:00:00.000Z',
    },
  ];

  it('renders chart container and title', () => {
    render(<IncomeExpenseChart transactions={mockTransactions} />);

    expect(screen.getByText(/comparativa mensual/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresos vs gastos/i)).toBeInTheDocument();
  });

  it('renders skeleton loader when isLoading is true', () => {
    render(<IncomeExpenseChart transactions={[]} isLoading={true} />);

    expect(screen.getByTestId('income-expense-chart-skeleton')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/IncomeExpenseChart.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `IncomeExpenseChart` in `src/features/dashboard/components/IncomeExpenseChart.tsx`**

Implement component using `monthlySeries` for the last 6 months, Recharts `ResponsiveContainer` and `BarChart` with rounded bars and custom dark tooltip.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/IncomeExpenseChart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/IncomeExpenseChart.tsx src/features/dashboard/components/IncomeExpenseChart.test.tsx
git commit -m "feat(dashboard): add IncomeExpenseChart with Recharts monthly series"
```

---

### Task 5: Category Expenses Donut Chart (`src/features/dashboard/components/CategoryExpenseDonutChart.tsx`)

**Files:**
- Create: `src/features/dashboard/components/CategoryExpenseDonutChart.tsx`
- Test: `src/features/dashboard/components/CategoryExpenseDonutChart.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface CategoryExpenseDonutChartProps {
    transactions: readonly Transaction[];
    categories: readonly Category[];
    isLoading?: boolean;
  }
  ```
- Uses: Recharts `PieChart`, `Pie`, `Cell`, `Tooltip`, `ResponsiveContainer`.
- Produces: Gráfica de dona con distribución porcentual de gastos por categoría, leyenda con colores específicos de categoría y tooltip formateado en dinero.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/dashboard/components/CategoryExpenseDonutChart.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CategoryExpenseDonutChart } from './CategoryExpenseDonutChart';
import type { Category, Transaction } from '@/domain/models';

describe('CategoryExpenseDonutChart', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Supermercado',
      kind: 'expense',
      icon: 'shopping_basket',
      color: '#d0bcff',
      keywords: ['super'],
    },
    {
      id: 'cat-tech',
      name: 'Tecnología',
      kind: 'expense',
      icon: 'storefront',
      color: '#4cd7f6',
      keywords: ['apple'],
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'expense',
      accountId: 'acc-1',
      amount: 30000,
      date: '2026-04-10',
      description: 'Super',
      categoryId: 'cat-groceries',
      createdAt: '2026-04-10T00:00:00.000Z',
      updatedAt: '2026-04-10T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 70000,
      date: '2026-04-12',
      description: 'Apple Gadgets',
      categoryId: 'cat-tech',
      createdAt: '2026-04-12T00:00:00.000Z',
      updatedAt: '2026-04-12T00:00:00.000Z',
    },
  ];

  it('renders donut chart container and category legend labels', () => {
    render(<CategoryExpenseDonutChart transactions={mockTransactions} categories={mockCategories} />);

    expect(screen.getByText(/gastos por categoría/i)).toBeInTheDocument();
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText('Tecnología')).toBeInTheDocument();
  });

  it('renders empty state when there are no expenses', () => {
    render(<CategoryExpenseDonutChart transactions={[]} categories={mockCategories} />);

    expect(screen.getByText(/sin gastos registrados en este período/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/CategoryExpenseDonutChart.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `CategoryExpenseDonutChart` in `src/features/dashboard/components/CategoryExpenseDonutChart.tsx`**

Aggregate expenses by `categoryId`, join with `categories` for colors and labels, and render Recharts `PieChart` with `innerRadius={60}` and `outerRadius={80}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/CategoryExpenseDonutChart.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/CategoryExpenseDonutChart.tsx src/features/dashboard/components/CategoryExpenseDonutChart.test.tsx
git commit -m "feat(dashboard): add CategoryExpenseDonutChart with Recharts donut and category legends"
```

---

### Task 6: Recent Transactions Widget (`src/features/dashboard/components/RecentTransactionsWidget.tsx`)

**Files:**
- Create: `src/features/dashboard/components/RecentTransactionsWidget.tsx`
- Test: `src/features/dashboard/components/RecentTransactionsWidget.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface RecentTransactionsWidgetProps {
    transactions: readonly Transaction[];
    accounts: readonly Account[];
    categories: readonly Category[];
    isLoading?: boolean;
  }
  ```
- Produces: Widget de movimientos recientes con pestañas de filtro (*All*, *Incomes*, *Expenses*), lista de los últimos 5 ítems, estado vacío si no hay movimientos y enlace a `/transactions`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/dashboard/components/RecentTransactionsWidget.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { RecentTransactionsWidget } from './RecentTransactionsWidget';
import type { Account, Category, Transaction } from '@/domain/models';

describe('RecentTransactionsWidget', () => {
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
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Tech',
      kind: 'expense',
      icon: 'storefront',
      color: '#4cd7f6',
      keywords: [],
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'income',
      accountId: 'acc-1',
      amount: 385000,
      date: '2026-04-22',
      description: 'Stripe Payout',
      createdAt: '2026-04-22T00:00:00.000Z',
      updatedAt: '2026-04-22T00:00:00.000Z',
    },
    {
      id: 'tx-2',
      type: 'expense',
      accountId: 'acc-1',
      amount: 124900,
      date: '2026-04-21',
      description: 'Apple Retail Store',
      categoryId: 'cat-1',
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
    },
  ];

  it('renders recent transactions and filters by tabs', () => {
    render(
      <MemoryRouter>
        <RecentTransactionsWidget
          transactions={mockTransactions}
          accounts={mockAccounts}
          categories={mockCategories}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText('Apple Retail Store')).toBeInTheDocument();

    const incomesTab = screen.getByRole('tab', { name: 'Incomes' });
    fireEvent.click(incomesTab);

    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.queryByText('Apple Retail Store')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/components/RecentTransactionsWidget.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `RecentTransactionsWidget` in `src/features/dashboard/components/RecentTransactionsWidget.tsx`**

Implement widget with `role="tablist"` matching App assertions (*All*, *Incomes*, *Expenses*), sorted by date descending, maximum 5 items, and link to `/transactions`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/components/RecentTransactionsWidget.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/components/RecentTransactionsWidget.tsx src/features/dashboard/components/RecentTransactionsWidget.test.tsx
git commit -m "feat(dashboard): add RecentTransactionsWidget with type tabs and navigation"
```

---

### Task 7: Full DashboardPage Integration with Offline Stores & Modals (`src/features/dashboard/DashboardPage.tsx`)

**Files:**
- Modify: `src/features/dashboard/DashboardPage.tsx`
- Test: `src/features/dashboard/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `useAccountsStore`, `useTransactionsStore`, `HeroNetWorthCard`, `QuickActionsBar`, `IncomeExpenseChart`, `CategoryExpenseDonutChart`, `RecentTransactionsWidget`, `TransactionFormModal`.
- Produces: Página completa de Dashboard con integración a tiendas reactivas, sincronización con el repositorio offline y apertura de modal para creación de transacciones desde acciones rápidas.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/dashboard/DashboardPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { DashboardPage } from './DashboardPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useAccountsStore } from '@/state/useAccountsStore';
import { useTransactionsStore } from '@/state/useTransactionsStore';

describe('DashboardPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useAccountsStore.getState().loadData(repo);
    await useTransactionsStore.getState().loadData(repo);
  });

  it('renders hero net worth, charts, and recent movements from seed data', async () => {
    render(
      <MemoryRouter>
        <DashboardPage repo={repo} />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Net Portfolio Worth')).toBeInTheDocument();
    expect(screen.getByText('DOP')).toBeInTheDocument();
    expect(screen.getByText('Stripe Payout')).toBeInTheDocument();
    expect(screen.getByText(/comparativa mensual/i)).toBeInTheDocument();
  });

  it('opens TransactionFormModal when clicking Add Expense quick action', async () => {
    render(
      <MemoryRouter>
        <DashboardPage repo={repo} />
      </MemoryRouter>,
    );

    const expenseBtn = await screen.findByRole('button', { name: /add expense/i });
    fireEvent.click(expenseBtn);

    expect(await screen.findByRole('heading', { name: /nueva transacción/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/DashboardPage.test.tsx`
Expected: FAIL because current DashboardPage does not open modals or connect to stores with `repo`.

- [ ] **Step 3: Implement `DashboardPage` in `src/features/dashboard/DashboardPage.tsx`**

Integrate all components with `useAccountsStore` and `useTransactionsStore`, wiring `TransactionFormModal` with default transaction types when triggering quick actions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/dashboard/DashboardPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/DashboardPage.tsx src/features/dashboard/DashboardPage.test.tsx
git commit -m "feat(dashboard): integrate DashboardPage with reactive stores, Recharts and quick action modals"
```

---

### Task 8: Full System Verification & PWA Build

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
