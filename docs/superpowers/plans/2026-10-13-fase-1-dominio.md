# Fase 1 — Núcleo de Dominio (TDD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lógica financiera pura en `src/domain/` (money, dates, balances, monthly, categories, budgets, amortization, filters) con 100 % de cobertura.

**Architecture:** Funciones puras sin React, PWA ni DB; entradas inmutables (`readonly`), salidas nuevas. Los importes son siempre enteros en unidades menores (`Cents`). Cada módulo tiene su `*.test.ts` al lado y se construye en ciclos Rojo → Verde → Refactor.

**Tech Stack:** TypeScript 7 (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), Vitest 5 + `@vitest/coverage-v8`.

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§2 Regla Monetaria, §5 Modelos, §6 Fase 1).

## Global Constraints

- "Todos los importes financieros se guardan como **enteros en unidades menores (céntimos)**. Prohibido el uso de `float` en el dominio."
- "El formateo se realiza exclusivamente con `Intl.NumberFormat`."
- `domain/` no importa React, Dexie, Workbox ni nada de `src/` fuera de `domain/`.
- Errores de entrada inválida: `RangeError` con mensaje en español.
- Redondeo monetario: *half away from zero* (`roundHalfAwayFromZero`).
- Cobertura 100 % (lines/branches/functions/statements) sobre `src/domain/**/*.ts` excepto `models.ts` y tests — ya configurado en `vite.config.ts`.
- Multimoneda: los agregados (monthly, budgets) asumen que el llamador pasa transacciones de una sola moneda; sólo `netWorthByCurrency` separa por moneda. No hay conversión FX en Fase 1.
- Locale por defecto para formateo: `'es-ES'`. En tests, normalizar espacios (`\u00a0`, `\u202f` → `' '`) antes de comparar.

## Review Focus

1. `parseMoney('1.234')` (parece separador de miles) → debe **rechazarse**, no convertirse en 1,23 € ni 1234 €. → Task 1.
2. Importes no enteros (`12.5`) o fuera de `Number.MAX_SAFE_INTEGER` entrando en `sumCents`/`assertCents` → `RangeError`. → Task 1.
3. Fechas fin de mes: préstamo que empieza el `2026-01-31` → primera cuota `2026-02-28`; desde `2028-01-31` → `2028-02-29`. → Tasks 2 y 7.
4. Transferencias entre cuentas propias no cambian el patrimonio neto; transferencia a la misma cuenta → delta 0. → Task 3.
5. Autocategorización con mayúsculas/acentos (`"CAFÉ Central"` ↔ keyword `"cafe"`) y sin falsos positivos por subcadena (`"bar"` no casa con `"Barbería"`). → Task 5.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/domain/models.ts` | Tipos del §5 del spec, copiados literalmente (sin lógica, excluido de cobertura). |
| `src/test/factories.ts` | Builders de test `makeAccount`, `makeTransaction`, `makeCategory`, `makeBudget`, `makeGoal` (código de test, fuera de cobertura). |
| `src/domain/money.ts` | Validación, aritmética, parseo y formateo de `Cents`. |
| `src/domain/dates.ts` | Aritmética de `ISODate`/`YearMonth` sin `Date` mutable ni zonas horarias. |
| `src/domain/balances.ts` | Saldo por cuenta, patrimonio neto por moneda, crédito disponible. |
| `src/domain/monthly.ts` | Resumen mensual ingresos/gastos/neto/tasa de ahorro y series. |
| `src/domain/categories.ts` | Normalización de texto y autocategorización por keywords. |
| `src/domain/budgets.ts` | Estado safe/warning/over, progreso de presupuestos y metas. |
| `src/domain/amortization.ts` | Cuota y tabla de amortización (método francés) en céntimos. |
| `src/domain/filters.ts` | Filtrado y ordenación de transacciones. |

Comando de test por tarea: `npx vitest run src/domain/<modulo>.test.ts`. Suite completa: `npm test`. Cobertura: `npm run test:coverage`.

---

### Task 1: models + money

**Files:** Create `src/domain/models.ts`, `src/test/factories.ts`, `src/domain/money.ts`, `src/domain/money.test.ts`.

**Interfaces — Produces:**
- `models.ts`: todos los tipos del §5 (`ID, Cents, ISODate, YearMonth, CurrencyCode, Account, AccountType, LoanTerms, Transaction, TransactionType, Category, Budget, BudgetStatus, BudgetProgress, Goal`).
- `factories.ts`: `makeX(overrides?: Partial<X>): X` para Account, Transaction, Category, Budget, Goal (ids incrementales `acc-1`, `tx-1`…; defaults: Account `checking`/`EUR`/`openingBalance 0`; Transaction `expense`/`amount 1000`/`date '2026-01-15'`/`accountId 'acc-1'`/`categoryId null`).
- `money.ts`:
  - `roundHalfAwayFromZero(value: number): number`
  - `isCents(value: unknown): value is Cents`
  - `assertCents(value: number, label?: string): Cents`
  - `sumCents(values: readonly Cents[]): Cents`
  - `multiplyCents(amount: Cents, factor: number): Cents`
  - `currencyFractionDigits(currency: CurrencyCode): number`
  - `parseMoney(input: string, currency?: CurrencyCode /* 'EUR' */): Cents`
  - `formatMoney(amount: Cents, currency: CurrencyCode, locale?: string /* 'es-ES' */): string`

Ciclos Rojo → Verde (un test, verlo fallar, código mínimo, verde, siguiente):

- [ ] **1.1** Crear `models.ts` (copia del §5) y `factories.ts`.
- [ ] **1.2 RED/GREEN `roundHalfAwayFromZero`:** `2.5→3`, `-2.5→-3`, `2.4→2`, `-0.4→0` (usar `toBe(0)` tras `+0` normalizado: `Object.is(r, -0)` debe ser `false`).
- [ ] **1.3 RED/GREEN `isCents`/`assertCents`:** `isCents(100)` true; `12.5`, `NaN`, `Infinity`, `2**53`, `'100'` false. `assertCents(12.5)` lanza `RangeError` con `/entero/`; `assertCents(100)` devuelve `100`.
- [ ] **1.4 RED/GREEN `sumCents`:** `[]→0`, `[100, -50, 25]→75`, `[100, 0.5]` lanza `RangeError`.
- [ ] **1.5 RED/GREEN `multiplyCents`:** `(1000, 0.15)→150`, `(1, 0.5)→1`, `(-1, 0.5)→-1`, `(999, 1/3)→333`; `factor` no finito → `RangeError`.
- [ ] **1.6 RED/GREEN `currencyFractionDigits`:** `EUR→2`, `JPY→0`, `KWD→3`; código inválido `'XX'` → `RangeError`.
- [ ] **1.7 RED/GREEN `parseMoney`:** `'12'→1200`, `'12.3'→1230`, `'12,34'→1234`, `' -7.50 '→-750`, `'0'→0`, `('1500','JPY')→1500`. Rechaza con `RangeError`: `''`, `'abc'`, `'1.234'`, `'1.2.3'`, `'1e3'`, `('15.5','JPY')`. Implementación por regex `^-?\d+([.,]\d{1,D})?$` y aritmética de strings (sin `parseFloat`).
- [ ] **1.8 RED/GREEN `formatMoney`:** `(1234567,'EUR')→'12.345,67 €'`, `(123450,'EUR')→'1234,50 €'`, `(-1234,'EUR')→'-12,34 €'`, `(0,'EUR')→'0,00 €'`, `(123456,'USD','en-US')→'$1,234.56'`, `(1500,'JPY')→'1500 JPY'`. Pasar a `Intl.NumberFormat#format` un **string decimal exacto** (p. ej. `'12345.67'`), no `amount / 100`.
- [ ] **1.9 REFACTOR + verificación:** `npx vitest run src/domain/money.test.ts` → todo PASS.
- [ ] **1.10 Commit:** `feat(domain): models, test factories and money utilities`.

### Task 2: dates

**Files:** Create `src/domain/dates.ts`, `src/domain/dates.test.ts`.

**Interfaces — Produces:**
- `toYearMonth(date: ISODate): YearMonth`
- `addMonthsToYearMonth(month: YearMonth, n: number): YearMonth`
- `monthRange(from: YearMonth, to: YearMonth): YearMonth[]` (inclusivo; `from > to → []`)
- `addMonthsToDate(date: ISODate, n: number): ISODate` (día recortado al último del mes)

- [ ] **2.1 RED/GREEN `toYearMonth`:** `'2026-03-09'→'2026-03'`.
- [ ] **2.2 RED/GREEN `addMonthsToYearMonth`:** `('2026-11',2)→'2027-01'`, `('2026-01',-1)→'2025-12'`, `('2026-05',0)→'2026-05'`, `('2026-01',-13)→'2024-12'`.
- [ ] **2.3 RED/GREEN `monthRange`:** `('2026-11','2027-02')→['2026-11','2026-12','2027-01','2027-02']`, `('2026-03','2026-03')→['2026-03']`, `('2026-04','2026-03')→[]`.
- [ ] **2.4 RED/GREEN `addMonthsToDate`:** `('2026-01-15',1)→'2026-02-15'`, `('2026-01-31',1)→'2026-02-28'`, `('2028-01-31',1)→'2028-02-29'`, `('2100-01-31',1)→'2100-02-28'`, `('2000-01-31',1)→'2000-02-29'`, `('2026-03-31',-1)→'2026-02-28'`, `('2026-12-10',1)→'2027-01-10'`. Sin `Date` (aritmética de enteros + regla bisiesta).
- [ ] **2.5 Verificar** `npx vitest run src/domain/dates.test.ts` → PASS. **Commit:** `feat(domain): ISO date and year-month arithmetic`.

### Task 3: balances

**Files:** Create `src/domain/balances.ts`, `src/domain/balances.test.ts`.

**Interfaces:** Consumes `sumCents` (Task 1). Produces:
- `transactionDelta(tx: Transaction, accountId: ID): Cents`
- `accountBalance(account: Account, transactions: readonly Transaction[]): Cents`
- `balancesByAccount(accounts: readonly Account[], transactions: readonly Transaction[]): ReadonlyMap<ID, Cents>`
- `netWorthByCurrency(accounts: readonly Account[], transactions: readonly Transaction[]): ReadonlyMap<CurrencyCode, Cents>` (incluye cuentas archivadas: archivar no hace desaparecer dinero)
- `availableCredit(account: Account, balance: Cents): Cents | null` (`creditLimit + balance` sólo para `credit_card` con `creditLimit`; si no, `null`)

- [ ] **3.1 RED/GREEN `transactionDelta`:** income en la cuenta `+amount`; expense `-amount`; transfer origen `-amount`; transfer destino `+amount`; transacción de otra cuenta `0`; transfer con `accountId === toAccountId` → `0`.
- [ ] **3.2 RED/GREEN `accountBalance`:** opening `10000` + income `5000` − expense `2000` − transfer out `1000` + transfer in `300` → `12300`. Tarjeta con opening `-20000` y gasto `5000` → `-25000`.
- [ ] **3.3 RED/GREEN `balancesByAccount`:** dos cuentas → `Map{acc-1→…, acc-2→…}`; cuenta sin transacciones → su `openingBalance`.
- [ ] **3.4 RED/GREEN `netWorthByCurrency`:** EUR checking `100000` + EUR credit_card `-30000` + USD savings `5000` → `{EUR: 70000, USD: 5000}`; una transferencia EUR→EUR de `20000` no cambia el total; cuenta archivada con saldo `1000` suma.
- [ ] **3.5 RED/GREEN `availableCredit`:** credit_card limit `100000`, balance `-25000` → `75000`; checking → `null`; credit_card sin límite → `null`.
- [ ] **3.6 Verificar** → PASS. **Commit:** `feat(domain): account balances and net worth`.

### Task 4: monthly

**Files:** Create `src/domain/monthly.ts`, `src/domain/monthly.test.ts`.

**Interfaces:** Consumes `toYearMonth`, `monthRange` (Task 2). Produces:
- `interface MonthlySummary { month: YearMonth; income: Cents; expense: Cents; net: Cents; savingsRate: number | null }`
- `monthlySummary(transactions: readonly Transaction[], month: YearMonth): MonthlySummary`
- `monthlySeries(transactions: readonly Transaction[], from: YearMonth, to: YearMonth): MonthlySummary[]`

`savingsRate = net / income` si `income > 0`, si no `null` (puede ser negativa).

- [ ] **4.1 RED/GREEN `monthlySummary`:** marzo con income `300000`, expenses `120000` + `30000`, una transfer `50000` y un expense de abril → `{income: 300000, expense: 150000, net: 150000, savingsRate: 0.5}`.
- [ ] **4.2 RED/GREEN** mes sin ingresos y con gasto `1000` → `net -1000`, `savingsRate null`; gastos > ingresos (`1000` vs `1500`) → `savingsRate -0.5`.
- [ ] **4.3 RED/GREEN `monthlySeries`:** `('2026-01','2026-03')` con datos sólo en enero y marzo → 3 elementos, febrero todo `0` y `savingsRate null`, ordenados ascendente.
- [ ] **4.4 Verificar** → PASS. **Commit:** `feat(domain): monthly income/expense summary and series`.

### Task 5: categories

**Files:** Create `src/domain/categories.ts`, `src/domain/categories.test.ts`.

**Interfaces — Produces:**
- `normalizeText(text: string): string` — NFD, quitar diacríticos (`\p{M}`), minúsculas, todo lo no alfanumérico → un espacio, `trim`.
- `suggestCategory(description: string, kind: Category['kind'], categories: readonly Category[]): Category | null` — sólo categorías del mismo `kind`; coincidencia **por palabra completa** (secuencia de tokens) del keyword normalizado; gana el keyword normalizado más largo; empate → la categoría que aparece antes. Keywords vacíos se ignoran.

- [ ] **5.1 RED/GREEN `normalizeText`:** `'  CAFÉ  Central!! '→'cafe central'`, `'Pingüino-Ñandú'→'pinguino nandu'`, `''→''`.
- [ ] **5.2 RED/GREEN** `suggestCategory('CAFÉ Central', 'expense', [Restaurantes{keywords:['cafe']}])` → Restaurantes.
- [ ] **5.3 RED/GREEN** sin coincidencia → `null`; `'Barbería Paco'` con keyword `'bar'` → `null`; keyword multi-palabra `'uber eats'` casa con `'Pedido UBER EATS 123'`.
- [ ] **5.4 RED/GREEN** filtra por `kind`: keyword `'nomina'` en categoría `income` no se sugiere para `'expense'`.
- [ ] **5.5 RED/GREEN** prioridad: `'Uber Eats cena'` con Transporte`['uber']` y Comida`['uber eats']` → Comida; empate de longitud → la primera de la lista; keyword `''` nunca casa.
- [ ] **5.6 Verificar** → PASS. **Commit:** `feat(domain): text normalization and keyword auto-categorization`.

### Task 6: budgets (+ metas)

**Files:** Create `src/domain/budgets.ts`, `src/domain/budgets.test.ts`.

**Interfaces:** Consumes `toYearMonth` (Task 2), `sumCents` (Task 1). Produces:
- `budgetStatus(spent: Cents, limit: Cents, alertThreshold: number): BudgetStatus` — `spent <= 0 → 'safe'`; `spent > limit → 'over'`; `spent >= limit * alertThreshold → 'warning'`; si no `'safe'`.
- `isBudgetActive(budget: Budget, month: YearMonth): boolean` — `month >= startMonth`.
- `budgetProgress(budget: Budget, transactions: readonly Transaction[], month: YearMonth): BudgetProgress` — `spent` = suma de `expense` con `categoryId === budget.categoryId` en `month`; `remaining = limit − spent` (puede ser negativo); `ratio = spent / limit` (si `limit <= 0`: `spent > 0 ? 1 : 0`).
- `budgetsProgress(budgets: readonly Budget[], transactions: readonly Transaction[], month: YearMonth): BudgetProgress[]` — sólo activos, mismo orden.
- `interface GoalProgress { goal: Goal; current: Cents; remaining: Cents; ratio: number; reached: boolean }`
- `goalProgress(goal: Goal, balances: ReadonlyMap<ID, Cents>): GoalProgress` — `current` = saldo de `linkedAccountId` (0 si no está en el mapa) o `manualAmount ?? 0`; `remaining = max(0, target − current)`; `ratio` acotado a `[0, 1]` (`target <= 0 → 1`); `reached = current >= target`.

- [ ] **6.1 RED/GREEN `budgetStatus`** (limit `10000`, threshold `0.8`): `0→safe`, `7999→safe`, `8000→warning`, `10000→warning` (justo en el límite no es "over"), `10001→over`; `(0, 0, 0.8)→safe`; `(1, 0, 0.8)→over`.
- [ ] **6.2 RED/GREEN `isBudgetActive`:** startMonth `'2026-03'`: `'2026-02'→false`, `'2026-03'→true`, `'2027-01'→true`.
- [ ] **6.3 RED/GREEN `budgetProgress`:** limit `50000`; gastos de la categoría en marzo `30000 + 15000`, uno de otra categoría, uno de febrero, un income con la misma categoría → `{spent: 45000, remaining: 5000, ratio: 0.9, status: 'warning', month: '2026-03'}`. Exceso: spent `60000` → `remaining -10000`, `status 'over'`. Limit `0` sin gasto → `ratio 0`.
- [ ] **6.4 RED/GREEN `budgetsProgress`:** de 2 presupuestos, el que empieza en `'2026-04'` se excluye en `'2026-03'`.
- [ ] **6.5 RED/GREEN `goalProgress`:** target `100000`, cuenta enlazada con `25000` → `{current: 25000, remaining: 75000, ratio: 0.25, reached: false}`; manual `120000` → `remaining 0, ratio 1, reached true`; sin enlace ni manual → `current 0`; enlazada a cuenta ausente → `current 0`; saldo enlazado negativo `-5000` → `ratio 0`; target `0` → `ratio 1, reached true`.
- [ ] **6.6 Verificar** → PASS. **Commit:** `feat(domain): budget status/progress and goal progress`.

### Task 7: amortization (método francés)

**Files:** Create `src/domain/amortization.ts`, `src/domain/amortization.test.ts`.

**Interfaces:** Consumes `roundHalfAwayFromZero`, `assertCents` (Task 1), `addMonthsToDate` (Task 2). Produces:
- `interface AmortizationRow { period: number; date: ISODate; payment: Cents; interest: Cents; principal: Cents; balance: Cents }`
- `monthlyPayment(terms: LoanTerms): Cents`
- `amortizationSchedule(terms: LoanTerms): AmortizationRow[]`

Algoritmo: `r = annualRate / 12`; cuota `= round(P·r / (1 − (1+r)^−n))` (o `round(P/n)` si `r = 0`). Por periodo `k`: `interest = round(balance·r)`, `principal = payment − interest`, `balance −= principal`, `date = addMonthsToDate(startDate, k)`. **Última fila:** `principal = saldo restante`, `payment = interest + principal` → saldo final exactamente `0`. Validación (`RangeError`): `principal` entero > 0, `termMonths` entero > 0, `annualRate` finito ≥ 0.

- [ ] **7.1 RED/GREEN `monthlyPayment`:** `{principal: 10000000, annualRate: 0.12, termMonths: 12}` → `888488`; `{100000, 0, 3}` → `33333`; `{15000000, 0.05, 360}` → `80523`.
- [ ] **7.2 RED/GREEN validación:** `principal 0`, `principal 10.5`, `termMonths 0`, `termMonths 1.5`, `annualRate -0.01`, `annualRate NaN` → `RangeError`.
- [ ] **7.3 RED/GREEN `amortizationSchedule` (12 % / 12 m):** 12 filas; fila 1 `{period 1, payment 888488, interest 100000, principal 788488, balance 9211512}`; fila 12 `{payment 888485, interest 8797, principal 879688, balance 0}`; `Σ principal = 10000000`; `Σ interest = 661853`; todos los campos enteros.
- [ ] **7.4 RED/GREEN** 0 %: pagos `[33333, 33333, 33334]`, intereses todos `0`.
- [ ] **7.5 RED/GREEN** fechas: `startDate '2026-01-31'` → `['2026-02-28', '2026-03-31', '2026-04-30']` (termMonths 3).
- [ ] **7.6 RED/GREEN** 30 años 5 %: 360 filas, última `balance 0`, `payment 80770`; ningún `balance` intermedio negativo.
- [ ] **7.7 Verificar** → PASS. **Commit:** `feat(domain): French-method amortization schedule in cents`.

### Task 8: filters

**Files:** Create `src/domain/filters.ts`, `src/domain/filters.test.ts`.

**Interfaces:** Consumes `normalizeText` (Task 5). Produces:
- `interface TransactionFilter { search?: string; types?: readonly TransactionType[]; accountIds?: readonly ID[]; categoryIds?: readonly (ID | null)[]; dateFrom?: ISODate; dateTo?: ISODate; minAmount?: Cents; maxAmount?: Cents }`
- `filterTransactions(transactions: readonly Transaction[], filter: TransactionFilter): Transaction[]` — AND entre criterios; campo ausente o array vacío = sin restricción; `search` normalizado como subcadena en `description` + `notes`; `accountIds` casa con `accountId` **o** `toAccountId`; `null` en `categoryIds` = sin categoría; fechas y montos inclusivos.
- `interface TransactionSort { by: 'date' | 'amount'; direction: 'asc' | 'desc' }`
- `sortTransactions(transactions: readonly Transaction[], sort?: TransactionSort /* {by:'date', direction:'desc'} */): Transaction[]` — devuelve array nuevo; desempate por `createdAt` y luego `id` en la misma dirección.

- [ ] **8.1 RED/GREEN** filtro vacío `{}` devuelve todas (array nuevo, no la misma referencia).
- [ ] **8.2 RED/GREEN `search`:** `'cafe'` encuentra `'Café Central'` y una con `notes: 'cafetería'`; espacios-sólo `'  '` = sin restricción.
- [ ] **8.3 RED/GREEN `types`, `accountIds`** (transfer entrante incluida por `toAccountId`), **`categoryIds`** (`[null]` → sólo sin categoría; `['cat-1', null]` → ambas).
- [ ] **8.4 RED/GREEN rangos:** `dateFrom '2026-02-01'`/`dateTo '2026-02-28'` incluye ambos extremos; `minAmount 1000`/`maxAmount 5000` incluye extremos; combinación de criterios = intersección.
- [ ] **8.5 RED/GREEN `sortTransactions`:** por defecto fecha desc; `amount asc`; misma fecha → desempate `createdAt`; no muta la entrada.
- [ ] **8.6 Verificar** → PASS. **Commit:** `feat(domain): transaction filters and sorting`.

### Task 9: Gate de cobertura

- [ ] **9.1** `npm run test:coverage` → Expected: todos los tests PASS y `All files | 100 | 100 | 100 | 100` para `src/domain`; el umbral no falla.
- [ ] **9.2** `npm run typecheck` → exit 0; `npm run build` → exit 0.
- [ ] **9.3** Si queda alguna rama sin cubrir: añadir el test que la ejercita (Rojo si revela un bug) o eliminar la rama muerta. Nunca `/* v8 ignore */`.
- [ ] **9.4 Commit** (si hubo cambios): `test(domain): reach 100% coverage`.
