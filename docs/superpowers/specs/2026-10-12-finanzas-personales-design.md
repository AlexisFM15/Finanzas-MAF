# Finanzas Personales PWA (Google Stitch Architecture) — Especificación de Diseño

> Estado: **Aprobado**. Listo para iniciar la Fase 0.
> Arquitectura basada en los patrones de Google Stitch con soporte PWA offline-first.

---

## 1. Contexto y Objetivos

- **Espacio de trabajo:** `Financial/` (local-first, sin dependencias previas).
- **Enfoque de aplicación:** PWA (Progressive Web App) instalable en escritorio y móvil, funcionamiento 100% offline, almacenamiento local persistente y actualización en segundo plano.
- **Patrón de Arquitectura (Stitch):** Separación estricta entre el dominio puro (`domain/`), adaptadores de datos y persistencia (`data/`), gestión de estado (`state/`), módulo de service worker/PWA (`pwa/`) y la capa de componentes e interfaz (`features/`, `components/ui/`).
- **Módulos principales:** Dashboard, Transacciones, Presupuestos y Metas, Cuentas.

---

## 2. Stack Tecnológico

| Capa | Elección | Motivo / Integración Stitch & PWA |
|---|---|---|
| **Build & PWA** | Vite + React 19 + `@vite-pwa/plugin` | Compilación ultrarrápida, generación automática de Web App Manifest y Service Worker con Workbox. |
| **Estilos** | Tailwind CSS v4 (`@theme` + variante `dark:`) | Estética SaaS moderna con soporte para temas claro/oscuro. |
| **Iconos** | `lucide-react` | Iconografía fluida y ligera. |
| **Router** | React Router v7 | Enrutamiento SPA en el cliente compatible con navegación offline. |
| **Estado** | Zustand (con middleware de persistencia y sync) | Estado reactivo desacoplado y sin boilerplate. |
| **Persistencia** | IndexedDB (Dexie.js) detrás del patrón `Repository` | Almacenamiento local-first directo en el dispositivo. |
| **Gráficos** | Recharts | Métricas, ingresos vs. gastos y presupuestos. |
| **Formularios & Validación** | `react-hook-form` + `zod` | Validación estricta previa a la conversión a entidades de dominio. |
| **Testing** | Vitest + Testing Library + Playwright | TDD puro en la capa de dominio. |

> **Regla Monetaria Central:** Todos los importes financieros se guardan como **enteros en unidades menores (céntimos)**. Prohibido el uso de `float` en el dominio. El formateo se realiza exclusivamente con `Intl.NumberFormat`.

---

## 3. Estructura de Carpetas

```text
Financial/
├── index.html
├── package.json
├── vite.config.ts            # Configuración de Vite, Vitest y VitePWA
├── tsconfig.json
├── public/
│   ├── manifest.webmanifest  # Web App Manifest PWA
│   ├── favicon.ico
│   └── icons/                # Iconos 192x192, 512x512 y maskable
├── docs/superpowers/         # Specs y planes de diseño Stitch
└── src/
    ├── main.tsx              # Registro de PWA Service Worker + Init
    ├── app/                  # Shell y contenedores Stitch
    │   ├── App.tsx
    │   ├── router.tsx
    │   ├── layout/           # Sidebar, Topbar, AppLayout, OfflineBanner
    │   └── providers/        # ThemeProvider, PWAInstallProvider
    ├── domain/               # LÓGICA PURA STITCH (Sin React, sin PWA, sin DB)
    │   ├── models.ts
    │   ├── money.ts               + money.test.ts
    │   ├── balances.ts            + balances.test.ts
    │   ├── monthly.ts             + monthly.test.ts
    │   ├── categories.ts          + categories.test.ts
    │   ├── budgets.ts             + budgets.test.ts
    │   ├── amortization.ts        + amortization.test.ts
    │   └── filters.ts             + filters.test.ts
    ├── data/                 # Adaptadores de persistencia Stitch
    │   ├── repository.ts     # Interfaz abstracta Repository
    │   ├── dexie/            # Implementación IndexedDB (Offline storage)
    │   ├── memory/           # Implementación en memoria (Tests)
    │   └── seed.ts           # Datos iniciales/demo
    ├── state/                # Adaptadores Zustand
    ├── pwa/                  # Módulo PWA Stitch
    │   ├── registerSW.ts     # Control del ciclo de vida del Service Worker
    │   ├── usePWAInstall.ts  # Prompt personalizado de instalación PWA
    │   └── sw.ts             # Estrategias de caching de Workbox
    ├── features/
    │   ├── dashboard/        # DashboardPage, BalanceCards, IncomeExpenseChart
    │   ├── transactions/     # TransactionsPage, TransactionTable, AddTransactionModal
    │   ├── budgets/          # BudgetsPage, BudgetProgress, GoalCard
    │   └── accounts/         # AccountsPage, AccountCard, AmortizationTable
    ├── components/ui/        # Componentes base
    ├── lib/                  # Utilidades globales (cn, formatters)
    └── styles/index.css      # Tailwind v4 + Tokens de diseño
```

---

## 4. Configuración PWA & Estrategia Offline

### Service Worker (vite-plugin-pwa + Workbox)

- **Precaching:** HTML, JS, CSS, fuentes e iconos Lucide para carga instantánea offline.
- **Caché de Assets:** Estrategia `StaleWhileRevalidate` para recursos estáticos.
- **Persistencia de Datos:** Lectura y escritura en IndexedDB (Dexie) localmente sin requerir red.

### Web App Manifest

| Campo | Valor |
|---|---|
| Name | Finanzas Personales |
| Short Name | Finanzas |
| Display | `standalone` |
| Background Color | `#09090b` (Zinc-950 dark) |
| Theme Color | `#09090b` |

### PWA Shell UI

- Banner de actualización disponible ("Nueva versión disponible — Actualizar").
- Indicador de estado Offline/Online en la barra superior (Topbar).
- Prompt de instalación PWA personalizado ("Instalar app").

---

## 5. Modelos de Datos (`src/domain/models.ts`)

```typescript
export type ID = string;               // crypto.randomUUID()
export type Cents = number;            // Entero en céntimos
export type ISODate = string;          // 'YYYY-MM-DD'
export type YearMonth = string;        // 'YYYY-MM'
export type CurrencyCode = string;     // ISO 4217 ('USD', 'EUR', etc.)

// ── Cuentas ────────────────────────────────────────────
export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'loan';

export interface Account {
  id: ID;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  openingBalance: Cents;        // Deudas son negativas
  creditLimit?: Cents;          // Exclusivo credit_card
  loan?: LoanTerms;             // Exclusivo loan
  institution?: string;
  color: string;
  archived: boolean;
  createdAt: string;
}

export interface LoanTerms {
  principal: Cents;
  annualRate: number;           // 0.12 = 12 %
  termMonths: number;
  startDate: ISODate;
}

// ── Transacciones ──────────────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: ID;
  type: TransactionType;
  accountId: ID;
  toAccountId?: ID;             // Exclusivo transfer
  amount: Cents;                // Siempre > 0
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
  icon: string;                 // Icono Lucide
  color: string;
  keywords: string[];           // Autocategorización
}

// ── Presupuestos y Metas ───────────────────────────────
export interface Budget {
  id: ID;
  categoryId: ID;
  monthlyLimit: Cents;
  alertThreshold: number;       // Default 0.8
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
```

---

## 6. Plan por Fases

| Fase | Contenido | Validación / Tests |
|---|---|---|
| **0. Scaffolding & PWA Setup** | Setup de Vite + React 19 + TS, Tailwind v4, Vitest, @vite-pwa/plugin, Web App Manifest e iconos PWA. | Smoke test de build + validación de Service Worker. |
| **1. Núcleo de Dominio (TDD)** | Lógica pura en `domain/`: money, balances, monthly, categories, budgets, amortization, filters. | 100% Cobertura de tests unitarios (TDD). |
| **2. Persistencia Offline** | Interfaz Repository, Dexie.js (IndexedDB), Repositorio en memoria para tests y seed demo. | Tests de integración IndexedDB con fake-indexeddb. |
| **3. UI Shell & PWA Controls** | AppLayout, ThemeProvider, PWA Install Prompt, Indicador de estado Offline/Online. | Tests de render de componentes shell. |
| **4. Cuentas** | Vistas de tarjetas por tipo, CRUD, amortización para préstamos. | Tests de integración e interacciones. |
| **5. Transacciones** | Tabla, filtros avanzados, modal con autocategorización. | Tests de flujos de creación y filtrado. |
| **6. Dashboard** | Resumen financiero, gráficos de Recharts, skeletons offline. | Tests de render con datos del seed. |
| **7. Presupuestos y Metas** | Cálculo de progress/umbrales, CRUD de metas y presupuestos. | Tests de lógica de presupuestos. |
| **8. Pulido, PWA & E2E** | Auditoría Lighthouse (PWA Score 100%), verificación de instalación offline y e2e. | Tests E2E con Playwright. |