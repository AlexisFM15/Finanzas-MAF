# Fase 4: Módulo de Cuentas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el módulo completo de Cuentas (`Accounts`) con soporte offline-first, tarjetas agrupadas por tipo, cálculo reactivo de saldos y límites de crédito, cuadro de amortización para préstamos (método francés), CRUD modal con validación Zod y estética Google Stitch.

**Architecture:** Se implementa un store de Zustand (`useAccountsStore`) desacoplado sobre la interfaz `AppRepository` (IndexedDB/Dexie y Memory fallback). La interfaz de usuario en `src/features/accounts/` compone componentes modulares (`AccountsSummary`, `AccountCard`, `AccountFormModal`, `AmortizationScheduleModal`) integrando funciones de dominio puras (`amortizationSchedule`, `monthlyPayment`, `accountBalance`, `balancesByAccount`, `formatMoney`, `parseMoney`).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand v5, Lucide React, React Hook Form, Zod, Vitest, Testing Library, Dexie.js (IndexedDB).

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§3, §5, §6 Fase 4).

## Global Constraints

- **Regla Monetaria Central:** Todos los importes financieros se representan exclusivamente como enteros en céntimos (`Cents`). Prohibido el uso de `float` en cálculos de dominio y estado. El formateo se realiza exclusivamente con `Intl.NumberFormat` vía `formatMoney`.
- **Pureza de Dominio:** Ningún componente de `src/domain/` debe importar de React, Dexie, React Router ni del DOM.
- **Estética Google Stitch Dark:** Colores `--color-surface` (`#0a1517`), `--color-surface-container` (`#162123`), `--color-primary` (`#4edea3`), `--color-secondary` (`#4cd7f6`), texto `--color-on-surface` (`#d9e5e7`). Fuentes `Space Grotesk` para números y encabezados, `Manrope` para cuerpos.
- **Accesibilidad y Móvil:** Touch targets mínimos de 44px, espaciado inferior seguro (`pb-safe`), navegación accesible por teclado y roles ARIA.
- **Offline-First:** Persistencia transparente en IndexedDB mediante `AccountRepository`, con auto-inicialización de seed data si la base de datos está vacía.

## Review Focus

1. **Signos monetarios en pasivos (Tarjetas y Préstamos):** En los modelos de dominio, las deudas se representan con saldos negativos mientras que `creditLimit` y `principal` son números positivos en céntimos. El formulario y las tarjetas deben convertir y renderizar estos valores sin incurrir en dobles negaciones ni alterar la exactitud de los céntimos.
2. **Casos borde en tabla de amortización de préstamos:** Un préstamo con tasa 0% anual (`annualRate: 0`) o con plazo de 1 mes debe renderizar correctamente la tabla y la cuota periódica sin divisiones por cero ni errores de redondeo.
3. **Manejo de estado vacío y filtrado sin coincidencias:** Si no existen cuentas o el usuario filtra por un tipo sin elementos (ej. sin préstamos), la vista debe mostrar un estado vacío pulido con acción para crear cuenta en vez de pantallas en blanco.
4. **Separación multi-divisa en resúmenes:** Si el usuario tiene cuentas en DOP y USD, los totales de activos y pasivos no deben sumarse aritméticamente entre diferentes divisas; deben agruparse por divisa o mostrar desglose localizado.
5. **Ciclo de vida de archivado y confirmación de borrado:** Archivar una cuenta debe alternar `archived: true/false` de inmediato sin borrar datos asociados; el borrado permanente debe exigir confirmación explícita del usuario para evitar pérdida accidental de datos.

---

### Task 1: Account State Management (`src/state/useAccountsStore.ts`)

**Files:**
- Create: `src/state/useAccountsStore.ts`
- Test: `src/state/useAccountsStore.test.ts`

**Interfaces:**
- Consumes: `AppRepository`, `AccountRepository`, `TransactionRepository`, `Account`, `Transaction`, `CreateAccountDTO`, `UpdateAccountDTO`, `ID`, `Cents`, `balancesByAccount`.
- Produces:
  ```typescript
  export interface AccountsState {
    accounts: Account[];
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    loadAccounts: (repo?: AppRepository) => Promise<void>;
    createAccount: (dto: CreateAccountDTO, repo?: AppRepository) => Promise<Account>;
    updateAccount: (id: ID, dto: UpdateAccountDTO, repo?: AppRepository) => Promise<Account>;
    toggleArchiveAccount: (id: ID, repo?: AppRepository) => Promise<void>;
    deleteAccount: (id: ID, repo?: AppRepository) => Promise<void>;
    getBalances: () => ReadonlyMap<ID, Cents>;
  }
  export const useAccountsStore: UseBoundStore<StoreApi<AccountsState>>;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// src/state/useAccountsStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAccountsStore } from './useAccountsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';
import { getDemoSeedData } from '@/data/seed';

describe('useAccountsStore', () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
    useAccountsStore.setState({ accounts: [], transactions: [], isLoading: false, error: null });
  });

  it('loads accounts and transactions from repository, seeding if empty', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const state = useAccountsStore.getState();
    expect(state.accounts.length).toBeGreaterThanOrEqual(5);
    expect(state.isLoading).toBe(false);
  });

  it('creates an account and updates store state', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const newAccount = await useAccountsStore.getState().createAccount({
      name: 'Nueva Billetera',
      type: 'cash',
      currency: 'DOP',
      openingBalance: 100000,
      color: '#4edea3',
      archived: false,
    }, repo);

    expect(newAccount.id).toBeDefined();
    expect(useAccountsStore.getState().accounts.some((a) => a.id === newAccount.id)).toBe(true);
  });

  it('toggles archive status of an account', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const target = useAccountsStore.getState().accounts[0]!;
    const initialArchived = target.archived;

    await useAccountsStore.getState().toggleArchiveAccount(target.id, repo);
    const updated = useAccountsStore.getState().accounts.find((a) => a.id === target.id);
    expect(updated?.archived).toBe(!initialArchived);
  });

  it('deletes an account from store and repository', async () => {
    await useAccountsStore.getState().loadAccounts(repo);
    const target = useAccountsStore.getState().accounts[0]!;

    await useAccountsStore.getState().deleteAccount(target.id, repo);
    expect(useAccountsStore.getState().accounts.some((a) => a.id === target.id)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/useAccountsStore.test.ts`
Expected: FAIL with "Cannot find module './useAccountsStore'".

- [ ] **Step 3: Implement `useAccountsStore` in `src/state/useAccountsStore.ts`**

Implement Zustand store connecting with `getDefaultRepository()` as default, handling auto-seed on initial load when accounts are empty, updating local state on create/update/archive/delete, and calculating account balances using `balancesByAccount`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/useAccountsStore.test.ts`
Expected: PASS (4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/state/useAccountsStore.ts src/state/useAccountsStore.test.ts
git commit -m "feat(accounts): add useAccountsStore with reactive persistence and auto-seed"
```

---

### Task 2: Financial Summary Header (`src/features/accounts/components/AccountsSummary.tsx`)

**Files:**
- Create: `src/features/accounts/components/AccountsSummary.tsx`
- Test: `src/features/accounts/components/AccountsSummary.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface AccountsSummaryProps {
    accounts: readonly Account[];
    balances: ReadonlyMap<ID, Cents>;
  }
  ```
- Produces: Header summary cards displaying:
  1. **Patrimonio Neto (Net Worth):** Total Activos + Total Pasivos (donde deudas son negativas) por divisa principal.
  2. **Total Activos (Assets):** Suma de saldos positivos (efectivo, cuentas corrientes, ahorros).
  3. **Total Deudas (Liabilities/Debt):** Suma de saldos de tarjetas de crédito y préstamos.
  4. Indicador de desglose multi-divisa si existen divisas secundarias (ej. USD).

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/accounts/components/AccountsSummary.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccountsSummary } from './AccountsSummary';
import type { Account, ID, Cents } from '@/domain/models';

describe('AccountsSummary', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Corriente',
      type: 'checking',
      currency: 'DOP',
      openingBalance: 5000000, // +$50,000.00 DOP
      color: '#4edea3',
      archived: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      name: 'Tarjeta Visa',
      type: 'credit_card',
      currency: 'DOP',
      openingBalance: -1000000, // -$10,000.00 DOP deuda
      color: '#4cd7f6',
      archived: false,
      createdAt: '2026-01-01',
    },
  ];

  const mockBalances = new Map<ID, Cents>([
    ['acc-1', 5000000],
    ['acc-2', -1000000],
  ]);

  it('renders Net Worth, Total Assets, and Total Liabilities with formatted currency', () => {
    render(<AccountsSummary accounts={mockAccounts} balances={mockBalances} />);

    expect(screen.getByText(/patrimonio neto/i)).toBeInTheDocument();
    expect(screen.getByText(/activos totales/i)).toBeInTheDocument();
    expect(screen.getByText(/deuda total/i)).toBeInTheDocument();

    // Net worth = 50,000 - 10,000 = 40,000
    expect(screen.getByText(/40\.000,00/)).toBeInTheDocument();
    // Assets = 50,000
    expect(screen.getByText(/50\.000,00/)).toBeInTheDocument();
    // Debt = 10,000
    expect(screen.getByText(/10\.000,00/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/accounts/components/AccountsSummary.test.tsx`
Expected: FAIL with "Cannot find module './AccountsSummary'".

- [ ] **Step 3: Implement `AccountsSummary` in `src/features/accounts/components/AccountsSummary.tsx`**

Implement component calculating sum of positive balances for assets, absolute sum of debt/loan balances for liabilities, and net worth per currency, formatted with `formatMoney` and styled using Stitch dark tokens (`surface-container`, `text-primary`, `text-error`, `text-secondary`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/accounts/components/AccountsSummary.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/components/AccountsSummary.tsx src/features/accounts/components/AccountsSummary.test.tsx
git commit -m "feat(accounts): add AccountsSummary component with net worth and asset/debt breakdown"
```

---

### Task 3: Account Card Component (`src/features/accounts/components/AccountCard.tsx`)

**Files:**
- Create: `src/features/accounts/components/AccountCard.tsx`
- Test: `src/features/accounts/components/AccountCard.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface AccountCardProps {
    account: Account;
    balance: Cents;
    onEdit: (account: Account) => void;
    onToggleArchive: (account: Account) => void;
    onDelete: (account: Account) => void;
    onViewAmortization?: (account: Account) => void;
  }
  ```
- Produces: Visual card for individual account displaying:
  - Account name, institution, currency, color indicator.
  - Account type badge (`cash`, `checking`, `savings`, `credit_card`, `loan`).
  - Formatted balance.
  - For `credit_card`: Credit limit, available credit (`availableCredit`), and credit utilization progress bar.
  - For `loan`: Original principal, annual rate, term, and "Ver amortización" button triggering `onViewAmortization`.
  - For archived accounts: Archived indicator badge.
  - Action buttons: Edit (pencil), Archive/Restore (archive/unarchive), Delete (trash).

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/accounts/components/AccountCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountCard } from './AccountCard';
import type { Account } from '@/domain/models';

describe('AccountCard', () => {
  const baseAccount: Account = {
    id: 'acc-card-1',
    name: 'Visa Signature',
    type: 'credit_card',
    currency: 'DOP',
    openingBalance: -2500000, // -$25,000 DOP balance
    creditLimit: 10000000,    // $100,000 DOP limit
    institution: 'Banco Popular',
    color: '#4cd7f6',
    archived: false,
    createdAt: '2026-01-01',
  };

  it('renders credit card details with limit and available credit', () => {
    render(
      <AccountCard
        account={baseAccount}
        balance={-2500000}
        onEdit={vi.fn()}
        onToggleArchive={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Visa Signature')).toBeInTheDocument();
    expect(screen.getByText('Banco Popular')).toBeInTheDocument();
    expect(screen.getByText(/límite/i)).toBeInTheDocument();
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
  });

  it('renders loan action button and triggers onViewAmortization', () => {
    const loanAccount: Account = {
      ...baseAccount,
      id: 'acc-loan-1',
      name: 'Préstamo Auto',
      type: 'loan',
      loan: {
        principal: 5000000,
        annualRate: 0.12,
        termMonths: 36,
        startDate: '2025-06-01',
      },
    };
    const onViewAmortization = vi.fn();

    render(
      <AccountCard
        account={loanAccount}
        balance={-3500000}
        onEdit={vi.fn()}
        onToggleArchive={vi.fn()}
        onDelete={vi.fn()}
        onViewAmortization={onViewAmortization}
      />
    );

    const amortBtn = screen.getByRole('button', { name: /tabla de amortización|amortización/i });
    expect(amortBtn).toBeInTheDocument();
    fireEvent.click(amortBtn);
    expect(onViewAmortization).toHaveBeenCalledWith(loanAccount);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/accounts/components/AccountCard.test.tsx`
Expected: FAIL with "Cannot find module './AccountCard'".

- [ ] **Step 3: Implement `AccountCard` in `src/features/accounts/components/AccountCard.tsx`**

Implement card with Stitch tokens, Lucide icons (`Wallet`, `CreditCard`, `Building2`, `PiggyBank`, `FileText`, `MoreVertical`, `Pencil`, `Archive`, `Trash2`), formatted balance with `formatMoney`, credit card limit/utilization bar, loan amortization trigger button, and edit/archive/delete action triggers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/accounts/components/AccountCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/components/AccountCard.tsx src/features/accounts/components/AccountCard.test.tsx
git commit -m "feat(accounts): add AccountCard component with credit card limits and loan amortizations"
```

---

### Task 4: Loan Amortization Schedule Modal (`src/features/accounts/components/AmortizationScheduleModal.tsx`)

**Files:**
- Create: `src/features/accounts/components/AmortizationScheduleModal.tsx`
- Test: `src/features/accounts/components/AmortizationScheduleModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface AmortizationScheduleModalProps {
    account: Account | null;
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- Produces: Modal dialog displaying loan terms (principal original, tasa anual %, plazo en meses, cuota mensual periódica estimada vía `monthlyPayment`) y tabla con las filas de amortización (`amortizationSchedule`):
  - Periodo (#)
  - Fecha estimada
  - Cuota mensual
  - Interés
  - Amortización a capital
  - Saldo pendiente

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/accounts/components/AmortizationScheduleModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AmortizationScheduleModal } from './AmortizationScheduleModal';
import type { Account } from '@/domain/models';

describe('AmortizationScheduleModal', () => {
  const loanAccount: Account = {
    id: 'acc-loan-1',
    name: 'Préstamo Auto',
    type: 'loan',
    currency: 'DOP',
    openingBalance: -5000000,
    loan: {
      principal: 5000000, // $50,000.00 DOP
      annualRate: 0.12,   // 12%
      termMonths: 12,     // 12 months
      startDate: '2026-01-01',
    },
    color: '#ffb4ab',
    archived: false,
    createdAt: '2026-01-01',
  };

  it('renders schedule rows and monthly payment when open', () => {
    render(
      <AmortizationScheduleModal
        account={loanAccount}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/cuadro de amortización/i)).toBeInTheDocument();
    expect(screen.getByText('Préstamo Auto')).toBeInTheDocument();
    expect(screen.getByText(/cuota mensual/i)).toBeInTheDocument();

    // Table rows: 12 periods
    expect(screen.getByText('Periodo 1')).toBeInTheDocument();
    expect(screen.getByText('Periodo 12')).toBeInTheDocument();
  });

  it('calls onClose when clicking close button or backdrop', () => {
    const onClose = vi.fn();
    render(
      <AmortizationScheduleModal
        account={loanAccount}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/accounts/components/AmortizationScheduleModal.test.tsx`
Expected: FAIL with "Cannot find module './AmortizationScheduleModal'".

- [ ] **Step 3: Implement `AmortizationScheduleModal` in `src/features/accounts/components/AmortizationScheduleModal.tsx`**

Implement modal using `monthlyPayment` and `amortizationSchedule` from `src/domain/amortization.ts`. Include metrics cards (Tasa, Plazo, Cuota, Total Intereses) and a responsive scrollable table styled with Stitch dark theme.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/accounts/components/AmortizationScheduleModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/components/AmortizationScheduleModal.tsx src/features/accounts/components/AmortizationScheduleModal.test.tsx
git commit -m "feat(accounts): add AmortizationScheduleModal with French method loan schedule"
```

---

### Task 5: Account Create / Edit Form Modal (`src/features/accounts/components/AccountFormModal.tsx`)

**Files:**
- Create: `src/features/accounts/components/AccountFormModal.tsx`
- Test: `src/features/accounts/components/AccountFormModal.test.tsx`

**Interfaces:**
- Consumes:
  ```typescript
  export interface AccountFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountToEdit?: Account | null;
    onSubmit: (dto: CreateAccountDTO | UpdateAccountDTO) => Promise<void>;
  }
  ```
- Produces: Modal with form validated with Zod:
  - Account name, type selector (`cash`, `checking`, `savings`, `credit_card`, `loan`).
  - Currency selector (`DOP`, `USD`, `EUR`).
  - Opening balance input parsed with `parseMoney`.
  - Institution (optional).
  - Color palette selection.
  - Conditional credit card fields: `creditLimit`.
  - Conditional loan fields: `principal`, `annualRate` (in percentage e.g. 12 -> 0.12), `termMonths`, `startDate`.
  - Automatic conversion: for debts/loans/credit cards with negative balances, handles the negative sign consistently.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/accounts/components/AccountFormModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountFormModal } from './AccountFormModal';

describe('AccountFormModal', () => {
  it('submits valid new cash account data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <AccountFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText(/nueva cuenta/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nombre de la cuenta/i), {
      target: { value: 'Billetera Principal' },
    });
    fireEvent.change(screen.getByLabelText(/saldo inicial/i), {
      target: { value: '1500,50' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cuenta/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Billetera Principal',
          openingBalance: 150050,
          currency: 'DOP',
          archived: false,
        })
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('displays loan fields when loan type is selected', () => {
    render(
      <AccountFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const typeSelect = screen.getByLabelText(/tipo de cuenta/i);
    fireEvent.change(typeSelect, { target: { value: 'loan' } });

    expect(screen.getByLabelText(/monto del préstamo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tasa de interés anual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/plazo en meses/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/accounts/components/AccountFormModal.test.tsx`
Expected: FAIL with "Cannot find module './AccountFormModal'".

- [ ] **Step 3: Implement `AccountFormModal` in `src/features/accounts/components/AccountFormModal.tsx`**

Implement form modal with React Hook Form + Zod, handling initial values in edit mode, dynamic conditional inputs for loans and credit cards, and parsing strings to `Cents` via `parseMoney`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/accounts/components/AccountFormModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/components/AccountFormModal.tsx src/features/accounts/components/AccountFormModal.test.tsx
git commit -m "feat(accounts): add AccountFormModal with Zod validation and conditional loan/credit fields"
```

---

### Task 6: AccountsPage Integration (`src/features/accounts/AccountsPage.tsx`)

**Files:**
- Modify: `src/features/accounts/AccountsPage.tsx`
- Test: `src/features/accounts/AccountsPage.test.tsx`

**Interfaces:**
- Consumes: `useAccountsStore`, `AccountsSummary`, `AccountCard`, `AmortizationScheduleModal`, `AccountFormModal`.
- Produces: Integrated `/accounts` page with:
  - Top header with Title, "Nueva Cuenta" primary button, and refresh.
  - AccountsSummary header metric cards.
  - Type Filter Tabs: "Todas", "Bancos y Ahorro" (`checking`, `savings`), "Tarjetas" (`credit_card`), "Préstamos" (`loan`), "Efectivo" (`cash`).
  - "Mostrar archivadas" toggle switch with count of archived accounts.
  - Account cards grid with responsive layout (1 col mobile, 2 cols tablet, 3 cols desktop).
  - Empty state with illustration/icon and "Crear primera cuenta" call to action.
  - Confirmation dialog for account deletion.
  - Modals wiring: AccountFormModal (create/edit) and AmortizationScheduleModal.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/accounts/AccountsPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccountsPage } from './AccountsPage';
import { useAccountsStore } from '@/state/useAccountsStore';
import { MemoryRepository } from '@/data/memory/MemoryRepository';

describe('AccountsPage Integration', () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await useAccountsStore.getState().loadAccounts(repo);
  });

  it('renders accounts list and summary from seed data', async () => {
    render(<AccountsPage />);

    expect(await screen.findByText('Banco BHD — Corriente')).toBeInTheDocument();
    expect(screen.getByText('Banco Popular — Visa Infinite')).toBeInTheDocument();
    expect(screen.getByText('Préstamo Vehículo')).toBeInTheDocument();
    expect(screen.getByText(/patrimonio neto/i)).toBeInTheDocument();
  });

  it('filters accounts by type tabs', async () => {
    render(<AccountsPage />);

    expect(await screen.findByText('Banco BHD — Corriente')).toBeInTheDocument();

    // Click "Tarjetas" tab
    const cardsTab = screen.getByRole('tab', { name: /tarjetas/i });
    fireEvent.click(cardsTab);

    expect(screen.getByText('Banco Popular — Visa Infinite')).toBeInTheDocument();
    expect(screen.queryByText('Banco BHD — Corriente')).not.toBeInTheDocument();
  });

  it('opens new account modal when clicking Nueva Cuenta button', async () => {
    render(<AccountsPage />);

    const newBtn = await screen.findByRole('button', { name: /nueva cuenta/i });
    fireEvent.click(newBtn);

    expect(await screen.findByRole('heading', { name: /nueva cuenta/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/accounts/AccountsPage.test.tsx`
Expected: FAIL because placeholder does not render seed data, filter tabs, or modals.

- [ ] **Step 3: Implement `AccountsPage` in `src/features/accounts/AccountsPage.tsx`**

Replace placeholder in `AccountsPage.tsx` with full implementation connecting to `useAccountsStore`, wire all tabs, search, archive toggle, and modals.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/accounts/AccountsPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts/AccountsPage.tsx src/features/accounts/AccountsPage.test.tsx
git commit -m "feat(accounts): integrate full AccountsPage with filtering, modals and Stitch aesthetics"
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
Expected: Vite build succeeds with service worker injection and Web App Manifest output.

- [ ] **Step 4: Final commit and status**

```bash
git commit --allow-empty -m "chore(accounts): complete Phase 4 accounts module with 100% tests passing"
```
