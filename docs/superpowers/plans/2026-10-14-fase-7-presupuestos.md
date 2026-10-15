# Fase 7: Presupuestos y Metas Financieras — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el módulo completo de Presupuestos y Metas Financieras (`/budgets`) con diseño Stitch oscuro, seguimiento en tiempo real de consumo por categoría según umbrales de alerta (`safe`, `warning`, `over`), cálculo automático de progreso de metas de ahorro (vinculadas a cuentas o con saldo manual), modales de creación/edición y navegación mensual.

**Architecture:** La gestión del estado se centraliza en `useBudgetsStore` utilizando Zustand y la capa de repositorio `AppRepository`. La lógica de negocio pura reutiliza las funciones verificadas de `src/domain/budgets.ts` (`budgetProgress`, `budgetsProgress`, `budgetStatus`, `goalProgress`) y `src/domain/balances.ts`. Los componentes de presentación se descomponen de forma modular (`BudgetCard`, `GoalCard`, `BudgetSummaryBar`, `BudgetMonthSelector`, `BudgetFormModal`, `GoalFormModal`) integrados en `BudgetsPage` con pestañas para alternar entre presupuestos mensuales y metas de ahorro.

**Tech Stack:** React 19, TypeScript, Zustand 5, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§3, §5, §6 Fase 7).

## Global Constraints

- Tipado estricto con `exactOptionalPropertyTypes: true` y 0 errores de TypeScript (`tsc -b`).
- Todos los montos se representan como enteros positivos en céntimos (`Cents`).
- Sin dependencias de UI en la capa `src/domain/`.
- Paleta visual Google Stitch: fondos oscuros profundos (`bg-surface`, `bg-surface-container-low`), acentos de alerta semánticos (`safe` esmeralda, `warning` ámbar, `over` coral/rojo), micro-animaciones y barras de progreso fluidas.
- Responsive y mobile-first con áreas táctiles mínimas de 44x44px.

## Review Focus

1. **Cálculo de progreso con gasto cero o negativo:** Si no hay gastos en la categoría en el mes seleccionado, `spent` debe ser 0, `ratio` 0 y estado `'safe'`.
2. **Rebasamiento de presupuesto (`over`):** Si `spent > limit`, el estado debe ser `'over'`, `remaining` debe ser negativo o cero según la visualización, y la barra de progreso debe marcar 100% en color de error sin romper el diseño.
3. **Metas vinculadas a cuentas vs manuales:** Si una meta tiene `linkedAccountId`, su saldo actual debe tomarse reactivamente del balance de dicha cuenta; si no, debe utilizar `manualAmount`. Si el balance supera `targetAmount`, debe marcar `reached: true`.
4. **Navegación mensual:** Al cambiar de mes con el selector, los progresos de los presupuestos deben recalcularse instantáneamente en base a las transacciones de dicho mes.
5. **Categoría única por presupuesto activo:** El modal de presupuesto debe evitar asignar una categoría que ya cuente con un presupuesto activo para el mismo mes de inicio.

---

### Task 1: Budgets & Goals Reactive Store (`src/state/useBudgetsStore.ts`)

**Files:**
- Create: `src/state/useBudgetsStore.ts`
- Test: `src/state/useBudgetsStore.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface BudgetsState {
    budgets: Budget[];
    goals: Goal[];
    categories: Category[];
    transactions: Transaction[];
    accounts: Account[];
    selectedMonth: YearMonth;
    isLoading: boolean;
    error: string | null;
    loadData: (repo?: AppRepository) => Promise<void>;
    setSelectedMonth: (month: YearMonth) => void;
    createBudget: (dto: CreateBudgetDTO, repo?: AppRepository) => Promise<Budget>;
    updateBudget: (id: ID, dto: UpdateBudgetDTO, repo?: AppRepository) => Promise<Budget>;
    deleteBudget: (id: ID, repo?: AppRepository) => Promise<void>;
    createGoal: (dto: CreateGoalDTO, repo?: AppRepository) => Promise<Goal>;
    updateGoal: (id: ID, dto: UpdateGoalDTO, repo?: AppRepository) => Promise<Goal>;
    deleteGoal: (id: ID, repo?: AppRepository) => Promise<void>;
    getBudgetsProgress: (month?: YearMonth) => BudgetProgress[];
    getGoalsProgress: () => GoalProgress[];
  }
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// src/state/useBudgetsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBudgetsStore } from './useBudgetsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';

describe('useBudgetsStore', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
  });

  it('loads budgets, goals, categories and computes progress for active month', async () => {
    await useBudgetsStore.getState().loadData(repo);

    const state = useBudgetsStore.getState();
    expect(state.budgets.length).toBeGreaterThanOrEqual(1);
    expect(state.goals.length).toBeGreaterThanOrEqual(1);

    const progress = state.getBudgetsProgress('2026-04');
    expect(progress.length).toBeGreaterThanOrEqual(1);
    expect(progress[0]?.status).toBeDefined();
  });

  it('creates and updates a budget and recalculates progress', async () => {
    await useBudgetsStore.getState().loadData(repo);

    const created = await useBudgetsStore.getState().createBudget(
      {
        categoryId: 'cat-services',
        monthlyLimit: 150000, // $1,500.00 DOP
        alertThreshold: 0.8,
        startMonth: '2026-04',
      },
      repo,
    );

    expect(created.id).toBeDefined();
    expect(useBudgetsStore.getState().budgets.some((b) => b.id === created.id)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/useBudgetsStore.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `useBudgetsStore` in `src/state/useBudgetsStore.ts`**

Implement store with default seed initialization, month state, CRUD operations, and domain selectors (`budgetsProgress`, `goalProgress`, `balancesByAccount`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/useBudgetsStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useBudgetsStore.ts src/state/useBudgetsStore.test.ts
git commit -m "feat(budgets): add useBudgetsStore with reactive progress selectors and CRUD"
```

---

### Task 2: Month Selector & Summary Bar (`src/features/budgets/components/BudgetsSummaryBar.tsx`)

**Files:**
- Create: `src/features/budgets/components/BudgetsSummaryBar.tsx`
- Test: `src/features/budgets/components/BudgetsSummaryBar.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface BudgetsSummaryBarProps {
    month: YearMonth;
    onMonthChange: (month: YearMonth) => void;
    budgetsProgress: readonly BudgetProgress[];
  }
  ```
- Produces: Barra con selector de mes (`< Mes Anterior`, `Mes Siguiente >`) y 3 tarjetas resumen: Total Presupuestado, Gastado, Restante y contador de alertas.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/budgets/components/BudgetsSummaryBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetsSummaryBar } from './BudgetsSummaryBar';
import type { BudgetProgress } from '@/domain/models';

describe('BudgetsSummaryBar', () => {
  const mockProgress: BudgetProgress[] = [
    {
      budget: {
        id: 'b-1',
        categoryId: 'cat-1',
        monthlyLimit: 100000,
        alertThreshold: 0.8,
        startMonth: '2026-04',
      },
      month: '2026-04',
      spent: 50000,
      remaining: 50000,
      ratio: 0.5,
      status: 'safe',
    },
  ];

  it('renders monthly totals and responds to month navigation', () => {
    const onMonthChange = vi.fn();
    render(
      <BudgetsSummaryBar
        month="2026-04"
        onMonthChange={onMonthChange}
        budgetsProgress={mockProgress}
      />,
    );

    expect(screen.getByText(/abril 2026/i)).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument(); // Límite total

    const nextBtn = screen.getByRole('button', { name: /mes siguiente/i });
    fireEvent.click(nextBtn);
    expect(onMonthChange).toHaveBeenCalledWith('2026-05');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/budgets/components/BudgetsSummaryBar.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `BudgetsSummaryBar` in `src/features/budgets/components/BudgetsSummaryBar.tsx`**

Implement component using `addMonthsToYearMonth` from `@/domain/dates` for pagination, aggregate total limit, total spent, and remaining.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/budgets/components/BudgetsSummaryBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budgets/components/BudgetsSummaryBar.tsx src/features/budgets/components/BudgetsSummaryBar.test.tsx
git commit -m "feat(budgets): add BudgetsSummaryBar with month navigation and aggregate metrics"
```

---

### Task 3: Budget Card with Status Alerts (`src/features/budgets/components/BudgetCard.tsx`)

**Files:**
- Create: `src/features/budgets/components/BudgetCard.tsx`
- Test: `src/features/budgets/components/BudgetCard.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface BudgetCardProps {
    progress: BudgetProgress;
    category?: Category | undefined;
    onEdit: (budget: Budget) => void;
    onDelete: (budget: Budget) => void;
  }
  ```
- Produces: Tarjeta individual de presupuesto con nombre de categoría, barra de progreso con gradiente semántico (`safe`, `warning`, `over`), importe gastado / límite, badge de estado y botones de edición y eliminación.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/budgets/components/BudgetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetCard } from './BudgetCard';
import type { BudgetProgress, Category } from '@/domain/models';

describe('BudgetCard', () => {
  const mockCategory: Category = {
    id: 'cat-groceries',
    name: 'Supermercado',
    kind: 'expense',
    icon: 'shopping_basket',
    color: '#d0bcff',
    keywords: [],
  };

  const mockProgress: BudgetProgress = {
    budget: {
      id: 'b-1',
      categoryId: 'cat-groceries',
      monthlyLimit: 100000, // $1,000.00 DOP
      alertThreshold: 0.8,
      startMonth: '2026-04',
    },
    month: '2026-04',
    spent: 85000, // $850.00 DOP (85% -> warning)
    remaining: 15000,
    ratio: 0.85,
    status: 'warning',
  };

  it('renders budget category, progress ratio and warning status badge', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <BudgetCard
        progress={mockProgress}
        category={mockCategory}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
    expect(screen.getByText(/alerta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /editar presupuesto/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProgress.budget);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/budgets/components/BudgetCard.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `BudgetCard` in `src/features/budgets/components/BudgetCard.tsx`**

Implement component with category badge, percentage progress bar, semantic status indicator, and accessible action buttons.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/budgets/components/BudgetCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budgets/components/BudgetCard.tsx src/features/budgets/components/BudgetCard.test.tsx
git commit -m "feat(budgets): add BudgetCard with semantic status colors and progress bar"
```

---

### Task 4: Budget Create/Edit Modal (`src/features/budgets/components/BudgetFormModal.tsx`)

**Files:**
- Create: `src/features/budgets/components/BudgetFormModal.tsx`
- Test: `src/features/budgets/components/BudgetFormModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface BudgetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: readonly Category[];
    existingBudgets: readonly Budget[];
    budgetToEdit?: Budget | null | undefined;
    defaultMonth?: YearMonth | undefined;
    onSubmit: (dto: CreateBudgetDTO | UpdateBudgetDTO) => Promise<void>;
  }
  ```
- Uses: `parseMoney` para validar límite mensual positivo en céntimos, selección de categoría y slider de umbral de alerta (50% a 95%).

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/budgets/components/BudgetFormModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetFormModal } from './BudgetFormModal';
import type { Category } from '@/domain/models';

describe('BudgetFormModal', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-dining',
      name: 'Restaurantes',
      kind: 'expense',
      icon: 'restaurant',
      color: '#ffb4ab',
      keywords: [],
    },
  ];

  it('submits valid budget with parsed cents and alert threshold', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <BudgetFormModal
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        existingBudgets={[]}
        defaultMonth="2026-04"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/categoría/i), { target: { value: 'cat-dining' } });
    fireEvent.change(screen.getByLabelText(/límite mensual/i), { target: { value: '500.00' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar presupuesto/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat-dining',
        monthlyLimit: 50000,
        startMonth: '2026-04',
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/budgets/components/BudgetFormModal.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `BudgetFormModal` in `src/features/budgets/components/BudgetFormModal.tsx`**

Implement modal dialog with form validation, positive amount parsing, threshold selection and accessible controls.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/budgets/components/BudgetFormModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budgets/components/BudgetFormModal.tsx src/features/budgets/components/BudgetFormModal.test.tsx
git commit -m "feat(budgets): add BudgetFormModal with category filter and limit validation"
```

---

### Task 5: Goal Card with Savings Progress (`src/features/budgets/components/GoalCard.tsx`)

**Files:**
- Create: `src/features/budgets/components/GoalCard.tsx`
- Test: `src/features/budgets/components/GoalCard.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface GoalCardProps {
    progress: GoalProgress;
    linkedAccount?: Account | undefined;
    onEdit: (goal: Goal) => void;
    onDelete: (goal: Goal) => void;
  }
  ```
- Produces: Tarjeta individual de meta con porcentaje acumulado, saldo actual vs objetivo, indicador de cuenta vinculada o saldo manual, y estado "Alcanzada" si `reached: true`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/budgets/components/GoalCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoalCard } from './GoalCard';
import type { Account } from '@/domain/models';
import type { GoalProgress } from '@/domain/budgets';

describe('GoalCard', () => {
  const mockProgress: GoalProgress = {
    goal: {
      id: 'g-1',
      name: 'Fondo de Emergencia',
      targetAmount: 5000000, // $50,000.00 DOP
      linkedAccountId: 'acc-savings',
      deadline: '2026-12-31',
    },
    current: 4000000, // $40,000.00 DOP (80%)
    remaining: 1000000,
    ratio: 0.8,
    reached: false,
  };

  const mockAccount: Account = {
    id: 'acc-savings',
    name: 'Cuenta de Ahorro',
    type: 'savings',
    currency: 'DOP',
    openingBalance: 4000000,
    color: '#4edea3',
    archived: false,
    createdAt: '2026-01-01',
  };

  it('renders goal name, progress and linked account indicator', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GoalCard
        progress={mockProgress}
        linkedAccount={mockAccount}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Fondo de Emergencia')).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
    expect(screen.getByText('Cuenta de Ahorro')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /editar meta/i }));
    expect(onEdit).toHaveBeenCalledWith(mockProgress.goal);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/budgets/components/GoalCard.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `GoalCard` in `src/features/budgets/components/GoalCard.tsx`**

Implement component with target progress indicator, reached banner, deadline countdown, and action triggers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/budgets/components/GoalCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budgets/components/GoalCard.tsx src/features/budgets/components/GoalCard.test.tsx
git commit -m "feat(budgets): add GoalCard with linked account tracking and progress bar"
```

---

### Task 6: Goal Create/Edit Modal (`src/features/budgets/components/GoalFormModal.tsx`)

**Files:**
- Create: `src/features/budgets/components/GoalFormModal.tsx`
- Test: `src/features/budgets/components/GoalFormModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface GoalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: readonly Account[];
    goalToEdit?: Goal | null | undefined;
    onSubmit: (dto: CreateGoalDTO | UpdateGoalDTO) => Promise<void>;
  }
  ```
- Produces: Modal para configurar metas con nombre, monto objetivo, opción de vinculación a cuenta bancaria o saldo manual, y fecha límite opcional.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/budgets/components/GoalFormModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoalFormModal } from './GoalFormModal';
import type { Account } from '@/domain/models';

describe('GoalFormModal', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-savings',
      name: 'Banreservas Ahorros',
      type: 'savings',
      currency: 'DOP',
      openingBalance: 1000000,
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  it('submits valid goal with linked account and target amount', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <GoalFormModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre de la meta/i), {
      target: { value: 'Comprar Laptop' },
    });
    fireEvent.change(screen.getByLabelText(/monto objetivo/i), {
      target: { value: '2,000.00' },
    });
    fireEvent.change(screen.getByLabelText(/cuenta vinculada/i), {
      target: { value: 'acc-savings' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar meta/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Comprar Laptop',
        targetAmount: 200000,
        linkedAccountId: 'acc-savings',
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/budgets/components/GoalFormModal.test.tsx`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `GoalFormModal` in `src/features/budgets/components/GoalFormModal.tsx`**

Implement modal with toggles between linked account / manual amount, positive number validation, and date picker.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/budgets/components/GoalFormModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budgets/components/GoalFormModal.tsx src/features/budgets/components/GoalFormModal.test.tsx
git commit -m "feat(budgets): add GoalFormModal with target amount and linked account options"
```

---

### Task 7: Full BudgetsPage Integration (`src/features/budgets/BudgetsPage.tsx`)

**Files:**
- Modify: `src/features/budgets/BudgetsPage.tsx`
- Test: `src/features/budgets/BudgetsPage.test.tsx`

**Interfaces:**
- Consumes: `useBudgetsStore`, `BudgetsSummaryBar`, `BudgetCard`, `BudgetFormModal`, `GoalCard`, `GoalFormModal`.
- Produces: Módulo completo `/budgets` con:
  - Pestañas superiores para alternar entre "Presupuestos Mensuales" y "Metas de Ahorro".
  - Botón de acción contextual ("Nuevo Presupuesto" / "Nueva Meta").
  - Diálogo de confirmación para eliminación segura.
  - Skeletons de carga offline y estados vacíos amigables.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/budgets/BudgetsPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { BudgetsPage } from './BudgetsPage';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { useBudgetsStore } from '@/state/useBudgetsStore';

describe('BudgetsPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useBudgetsStore.getState().loadData(repo);
  });

  it('renders budgets list and switches to goals tab', async () => {
    render(<BudgetsPage repo={repo} />);

    expect(await screen.findByText(/presupuestos y metas/i)).toBeInTheDocument();
    expect(screen.getByText(/total presupuestado/i)).toBeInTheDocument();

    const goalsTab = screen.getByRole('tab', { name: /metas de ahorro/i });
    fireEvent.click(goalsTab);

    expect(await screen.findByText('Fondo de Emergencia')).toBeInTheDocument();
  });

  it('opens new budget modal when clicking Nuevo Presupuesto button', async () => {
    render(<BudgetsPage repo={repo} />);

    const newBtn = await screen.findByRole('button', { name: /nuevo presupuesto/i });
    fireEvent.click(newBtn);

    expect(await screen.findByRole('heading', { name: /nuevo presupuesto/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/budgets/BudgetsPage.test.tsx`
Expected: FAIL because placeholder does not render live tabs or modals.

- [ ] **Step 3: Implement `BudgetsPage` in `src/features/budgets/BudgetsPage.tsx`**

Integrate components with `useBudgetsStore`, deletion dialog, and modals wiring.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/budgets/BudgetsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/budgets/BudgetsPage.tsx src/features/budgets/BudgetsPage.test.tsx
git commit -m "feat(budgets): integrate full BudgetsPage with tabs, modals and deletion confirmation"
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
