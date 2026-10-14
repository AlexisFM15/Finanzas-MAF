# Fase 2 — Persistencia Offline (IndexedDB / Dexie) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la capa de datos y persistencia offline (`src/data/`) con la interfaz abstracta `Repository`, adaptador en memoria (`MemoryRepository`), adaptador IndexedDB con `Dexie.js` (`FinancialDB` + `DexieRepository`), y conjunto de datos demo (`seed.ts`), validado con tests de integración con `fake-indexeddb`.

**Architecture:** Patrón Repository tipado y asíncrono. La capa de dominio (`src/domain/`) permanece pura y ajena a la base de datos; la capa de estado (Zustand en Fase 3) y UI consumen exclusivamente la interfaz `AppRepository`. La suite de integración se ejecuta contra una suite común de pruebas para garantizar que `MemoryRepository` y `DexieRepository` se comportan exactamente igual (Liskov Substitution Principle).

**Tech Stack:** TypeScript 7 (strict), Dexie.js 4, fake-indexeddb 6, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§2 Regla Monetaria, §3 Estructura de Carpetas, §4 Estrategia Offline, §5 Modelos, §6 Fase 2).

## Global Constraints

- "Todos los importes financieros se guardan como **enteros en unidades menores (céntimos)**. Prohibido el uso de `float` en el dominio y en la base de datos."
- "Lectura y escritura en IndexedDB (Dexie) localmente sin requerir red."
- Todos los métodos de repositorio son asíncronos (`Promise<T>`) para respetar la naturaleza no bloqueante de IndexedDB.
- `MemoryRepository` y `DexieRepository` deben implementar la misma interfaz `AppRepository`.
- Errores cuando una entidad no existe en `update` o `delete`: rechazar con `Error('Entidad no encontrada: <id>')`.
- Creación de IDs: si la entidad entrante no tiene `id`, el repositorio genera uno automáticamente con `crypto.randomUUID()`.
- Timestamps: `createdAt` y `updatedAt` en formato ISO 8601 (`new Date().toISOString()`).

## Review Focus

1. **Integridad de tipos monetarios:** Verificar que `amount`, `openingBalance`, `creditLimit`, `monthlyLimit`, `targetAmount` se guarden y recuperen estrictamente como enteros seguros (`Cents`), nunca como flotantes ni strings. → Task 1 y 2.
2. **Transferencias y cuentas vinculadas:** Al eliminar una cuenta, qué ocurre con transacciones huérfanas o cuentas de destino (`toAccountId`); soporte de transacciones atómicas donde aplique. → Task 2 y 3.
3. **Consultas compuestas por rango de fechas y cuentas:** `getTransactionsByAccount` y `getTransactionsByDateRange` deben devolver resultados correctamente ordenados por fecha descendente. → Task 2 y 3.
4. **Respaldo y restauración offline (Export/Import JSON):** `exportJSON()` debe generar un dump completo e inmutable, e `importJSON(data, { mode: 'replace' | 'merge' })` debe restaurar la base de datos preservando la consistencia. → Task 4.
5. **Idempotencia y coherencia del Seed:** `seedDemoData(repo)` debe poblar cuentas, categorías, presupuestos, metas y transacciones realistas alineadas con el Stitch Dashboard (`$84,620.50 DOP`), sin duplicar datos si se invoca sobre una base ya inicializada. → Task 5.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/data/repository.ts` | Definición de las interfaces `Repository<T>`, `AccountRepository`, `TransactionRepository`, `CategoryRepository`, `BudgetRepository`, `GoalRepository` y `AppRepository`. |
| `src/data/memory/MemoryRepository.ts` | Implementación en memoria (`Map<ID, T>`) para testing rápido y desacoplado. |
| `src/data/dexie/db.ts` | Clase `FinancialDB extends Dexie` con esquemas y tablas indexadas. |
| `src/data/dexie/DexieRepository.ts` | Implementación de `AppRepository` sobre `FinancialDB`. |
| `src/data/seed.ts` | Datos semilla realistas (cuentas DOP/USD, categorías con keywords, transacciones, presupuestos y metas). |
| `src/data/repository.contract.test.ts` | Suite compartida de pruebas de contrato aplicable a cualquier implementación de `AppRepository`. |
| `src/data/memory/MemoryRepository.test.ts` | Test de integración de `MemoryRepository`. |
| `src/data/dexie/DexieRepository.test.ts` | Test de integración de `DexieRepository` usando `fake-indexeddb`. |
| `src/data/seed.test.ts` | Test de validación del seed de datos e integración con cálculos de dominio. |

---

### Task 1: Definición de Interfaces Repository (`src/data/repository.ts`)

**Files:**
- Create: `src/data/repository.ts`
- Test: `src/data/repository.contract.test.ts` (test harness preliminar)

**Interfaces:**
- Consumes: `Account`, `Transaction`, `Category`, `Budget`, `Goal`, `ID`, `ISODate`, `YearMonth` de `src/domain/models.ts`.
- Produces:
  - `type CreateAccountDTO = Omit<Account, 'id' | 'createdAt'> & { id?: ID; createdAt?: string }`
  - `type UpdateAccountDTO = Partial<Omit<Account, 'id' | 'createdAt'>>`
  - `interface AccountRepository`: `getAll()`, `getActive()`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`
  - `type CreateTransactionDTO = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: ID; createdAt?: string; updatedAt?: string }`
  - `type UpdateTransactionDTO = Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>`
  - `interface TransactionRepository`: `getAll()`, `getById(id)`, `getByAccount(accountId)`, `getByDateRange(startDate, endDate)`, `getByCategory(categoryId)`, `create(dto)`, `update(id, dto)`, `delete(id)`
  - `interface CategoryRepository`: `getAll()`, `getById(id)`, `getByKind(kind)`, `create(dto)`, `update(id, dto)`, `delete(id)`
  - `interface BudgetRepository`: `getAll()`, `getById(id)`, `getByMonth(month)`, `getByCategory(categoryId)`, `create(dto)`, `update(id, dto)`, `delete(id)`
  - `interface GoalRepository`: `getAll()`, `getById(id)`, `create(dto)`, `update(id, dto)`, `delete(id)`
  - `interface BackupData { version: number; exportedAt: string; accounts: Account[]; transactions: Transaction[]; categories: Category[]; budgets: Budget[]; goals: Goal[] }`
  - `interface AppRepository`:
    - `accounts: AccountRepository`
    - `transactions: TransactionRepository`
    - `categories: CategoryRepository`
    - `budgets: BudgetRepository`
    - `goals: GoalRepository`
    - `clearAll(): Promise<void>`
    - `exportJSON(): Promise<BackupData>`
    - `importJSON(data: BackupData, mode?: 'replace' | 'merge'): Promise<void>`

- [ ] **Step 1: Write the contract test suite structure**
  Crear `src/data/repository.contract.test.ts` exportando `function runRepositoryContractTests(name: string, factory: () => Promise<AppRepository>, cleanup?: () => Promise<void>): void`.
- [ ] **Step 2: Implement interfaces in `src/data/repository.ts`**
  Definir todas las interfaces y tipos DTOs estrictamente tipados.
- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npm run typecheck`
  Expected: PASS
- [ ] **Step 4: Commit**
  `git commit -m "feat(data): define repository interfaces and DTOs"`

---

### Task 2: Implementación en Memoria (`src/data/memory/MemoryRepository.ts`)

**Files:**
- Create: `src/data/memory/MemoryRepository.ts`
- Test: `src/data/memory/MemoryRepository.test.ts`

**Interfaces:**
- Consumes: Interfaces de `src/data/repository.ts` y modelos de `src/domain/models.ts`.
- Produces: Clase `MemoryRepository implements AppRepository`.

- [ ] **Step 1: Write failing test in `src/data/memory/MemoryRepository.test.ts`**
  Instanciar `MemoryRepository` y ejecutar la suite de contrato `runRepositoryContractTests('MemoryRepository', async () => new MemoryRepository())`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/data/memory/MemoryRepository.test.ts`
  Expected: FAIL con `MemoryRepository is not defined`
- [ ] **Step 3: Implement `MemoryRepository`**
  Implementar almacenes `Map<ID, Entity>` clonando objetos para garantizar inmutabilidad, ordenación por fecha descendente para transacciones, filtros por cuenta y categoría, `clearAll()`, `exportJSON()` e `importJSON()`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/data/memory/MemoryRepository.test.ts`
  Expected: PASS
- [ ] **Step 5: Commit**
  `git commit -m "feat(data): implement in-memory repository with contract tests"`

---

### Task 3: Base de Datos Dexie & Adaptador IndexedDB (`src/data/dexie/`)

**Files:**
- Create: `src/data/dexie/db.ts`
- Create: `src/data/dexie/DexieRepository.ts`
- Test: `src/data/dexie/DexieRepository.test.ts`

**Interfaces:**
- Consumes: `dexie`, `fake-indexeddb/auto`, `AppRepository` de `src/data/repository.ts`.
- Produces:
  - Clase `FinancialDB extends Dexie`:
    - `accounts: Table<Account, string>`
    - `transactions: Table<Transaction, string>`
    - `categories: Table<Category, string>`
    - `budgets: Table<Budget, string>`
    - `goals: Table<Goal, string>`
  - Clase `DexieRepository implements AppRepository`.
  - Helper `createDexieRepository(dbName?: string): DexieRepository`.

- [ ] **Step 1: Write failing integration test in `src/data/dexie/DexieRepository.test.ts`**
  Configurar `fake-indexeddb`, instanciar `DexieRepository` con una base de datos aislada por test y conectar con `runRepositoryContractTests`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/data/dexie/DexieRepository.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement `FinancialDB` in `src/data/dexie/db.ts`**
  Configurar tiendas con índices:
  - `accounts`: `'id, type, currency, archived, createdAt'`
  - `transactions`: `'id, type, accountId, toAccountId, date, categoryId, createdAt'`
  - `categories`: `'id, kind, name'`
  - `budgets`: `'id, categoryId, startMonth'`
  - `goals`: `'id, targetAmount, deadline'`
- [ ] **Step 4: Implement `DexieRepository` in `src/data/dexie/DexieRepository.ts`**
  Implementar todos los métodos de `AppRepository` usando transacciones Dexie seguras y consultas indexadas.
- [ ] **Step 5: Run integration tests to verify they pass**
  Run: `npx vitest run src/data/dexie/DexieRepository.test.ts`
  Expected: PASS
- [ ] **Step 6: Commit**
  `git commit -m "feat(data): implement Dexie IndexedDB repository with fake-indexeddb tests"`

---

### Task 4: Funciones de Exportación e Importación de Respaldo JSON

**Files:**
- Modify: `src/data/repository.ts`
- Modify: `src/data/memory/MemoryRepository.ts`
- Modify: `src/data/dexie/DexieRepository.ts`
- Test: `src/data/repository.contract.test.ts`

**Interfaces:**
- Consumes: `BackupData`, `AppRepository`.
- Produces: Validación de esquema al importar (usando `zod` o validadores de campo) para evitar inyección de datos corruptos o importes no enteros.

- [ ] **Step 1: Write tests for JSON export and import**
  Añadir pruebas en el contrato para:
  - Exportar base de datos con datos heterogéneos.
  - Limpiar base de datos.
  - Importar con modo `replace` y verificar restauración exacta.
  - Importar con modo `merge` y verificar que actualiza existentes y añade nuevos.
  - Intentar importar JSON malformado o con importes flotantes y verificar rechazo.
- [ ] **Step 2: Implement validation and import/export logic**
  Implementar validaciones defensivas de `BackupData` en ambos repositorios.
- [ ] **Step 3: Run contract tests**
  Run: `npx vitest run src/data/memory/MemoryRepository.test.ts src/data/dexie/DexieRepository.test.ts`
  Expected: PASS
- [ ] **Step 4: Commit**
  `git commit -m "feat(data): implement robust JSON backup export and import"`

---

### Task 5: Conjunto de Datos Semilla Demo (`src/data/seed.ts`)

**Files:**
- Create: `src/data/seed.ts`
- Test: `src/data/seed.test.ts`

**Interfaces:**
- Consumes: `AppRepository` de `src/data/repository.ts`, modelos de `src/domain/models.ts`, cálculos de `src/domain/balances.ts` y `src/domain/money.ts`.
- Produces:
  - `function getDemoSeedData(): BackupData`
  - `function seedDemoData(repo: AppRepository, options?: { force?: boolean }): Promise<boolean>`

**Datos del Seed alineados con el prototipo Stitch:**
- Cuentas:
  - `Banco BHD — Cuenta Corriente`: checking, DOP, saldo que concuerda con el dashboard.
  - `Banco Popular — Tarjeta Visa Infinite`: credit_card, DOP, límite de crédito 200,000 DOP ($200,000.00).
  - `Cuenta de Ahorro en Dólares`: savings, USD.
  - `Préstamo Personal Auto`: loan, DOP, con `LoanTerms`.
  - `Efectivo en Billetera`: cash, DOP.
- Categorías con keywords de autocategorización en español:
  - Gastos: Vivienda, Servicios, Supermercado, Restaurantes/Salidas, Transporte, Salud, Suscripciones, Educación.
  - Ingresos: Salario/Nómina, Freelance/Honorarios, Dividendos/Rendimientos, Reembolsos.
- Transacciones:
  - Incluye las 5 transacciones del Dashboard Stitch (Stripe Payout, Apple Retail Store, Vanguard Dividend Yield, Whole Foods Market, Figma Enterprise) más transacciones históricas de los últimos 6 meses para poblar el gráfico de barras.
- Presupuestos y Metas:
  - Presupuestos mensuales configurados para Vivienda, Supermercado y Salidas.
  - Metas de ahorro: Fondo de Emergencia y Vacaciones.

- [ ] **Step 1: Write test in `src/data/seed.test.ts`**
  Verificar que `seedDemoData` popule la base de datos, que el cálculo de `computeAccountBalances` arroje los saldos esperados, y que llamar a `seedDemoData` por segunda vez sin `{ force: true }` no duplique registros.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/data/seed.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement `src/data/seed.ts`**
  Escribir los datos semilla y las funciones `getDemoSeedData()` y `seedDemoData(repo, options)`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/data/seed.test.ts`
  Expected: PASS
- [ ] **Step 5: Run full test suite & coverage**
  Run: `npm test && npm run test:coverage`
  Expected: 100% de tests pasando en toda la suite.
- [ ] **Step 6: Commit**
  `git commit -m "feat(data): add realistic demo seed aligned with Stitch dashboard"`

---

### Task 6: Integración con la PWA e Inicialización

**Files:**
- Modify: `src/data/index.ts` (barrel export)
- Modify: `src/main.tsx` o proveedor base
- Test: `src/data/dexie/DexieRepository.test.ts`

**Interfaces:**
- Produces: Exportación central de `repository`, instancia singleton por defecto `defaultRepository` (que usa `DexieRepository` en el navegador y `MemoryRepository` en entornos sin IndexedDB).

- [ ] **Step 1: Create barrel export `src/data/index.ts`**
  Exportar interfaces, repositorios y seed.
- [ ] **Step 2: Run typecheck and full test suite**
  Run: `npm run typecheck && npm test && npm run build`
  Expected: PASS sin advertencias.
- [ ] **Step 3: Commit**
  `git commit -m "feat(data): complete Phase 2 offline persistence layer"`
