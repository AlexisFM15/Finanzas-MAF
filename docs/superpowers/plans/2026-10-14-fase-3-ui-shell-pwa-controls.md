# Fase 3 — UI Shell & PWA Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el shell de la aplicación (`src/app/layout/`, `src/app/providers/`, `src/app/router.tsx`) con soporte completo de tema claro/oscuro (`ThemeProvider`), controles de PWA (indicador de estado Online/Offline, prompt de instalación personalizado e indicador de actualización del Service Worker), navegación responsiva (Topbar, BottomNav y Sidebar de escritorio) e integración con React Router.

**Architecture:** 
- La arquitectura desacopla el estado del entorno PWA y el tema visual mediante contextos de React (`ThemeProvider`, `PWAProvider`).
- `AppLayout` orquesta la barra superior (`Topbar`), banners de estado y actualización (`OfflineBanner`), navegación inferior (`BottomNav`), barra lateral para pantallas medianas/grandes (`Sidebar`) y el contenedor de páginas mediante `Outlet` de React Router.
- Las páginas de módulos futuros (Cuentas, Transacciones, Presupuestos) cuentan con componentes iniciales accesibles mientras que `DashboardPage` se conecta como vista principal.

**Tech Stack:** React 19, React Router v7 (`createBrowserRouter`, `RouterProvider`), Tailwind CSS v4, Lucide React / Material Symbols, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-12-finanzas-personales-design.md` (§3 Estructura de Carpetas, §4 Configuración PWA & Estrategia Offline, §6 Fase 3).

## Global Constraints

- "Banner de actualización disponible ('Nueva versión disponible — Actualizar')."
- "Indicador de estado Offline/Online en la barra superior (Topbar)."
- "Prompt de instalación PWA personalizado ('Instalar app')."
- Soporte de temas: `dark` (por defecto, fondo `#0a1517` / Stitch Dark), `light`, y `system`. La clase `.dark` se conmuta sobre `document.documentElement`.
- Persistencia de preferencias de usuario (tema) en `localStorage` con clave `finanzas_theme`.
- Soporte para áreas seguras (`pb-safe`, `pt-safe`) en dispositivos móviles.
- Los módulos de dominio (`src/domain/`) continúan sin ser alterados ni acoplados a React.

## Review Focus

1. **Ciclo de vida del Service Worker y recarga:** Asegurar que el banner de actualización invoque `updateServiceWorker(true)` de forma segura y no bloqueante. → Task 2 y 3.
2. **Compatibilidad offline en `useOnlineStatus`:** Cambios de conectividad (`navigator.onLine`, eventos `online`/`offline`) deben actualizar reactivamente la UI sin parpadeos. → Task 2 y 3.
3. **Instalación PWA (`beforeinstallprompt`):** El botón de instalación solo debe mostrarse cuando el navegador emita `beforeinstallprompt` y ocultarse tras `appinstalled`. → Task 2 y 3.
4. **Respuesta móvil vs. escritorio:** En pantallas pequeñas `< 768px` se muestra `BottomNav` y `Topbar`; en pantallas `>= 768px` se muestra `Sidebar` y la barra de navegación inferior se oculta. → Task 3 y 4.
5. **Navegación accesible con Router:** Cada ruta activa debe tener `aria-current="page"` y ser navegable tanto con teclado como con interacción táctil. → Task 4.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/app/providers/ThemeProvider.tsx` | Contexto de tema (`light`, `dark`, `system`), persistencia en `localStorage` y sincronización con clase `.dark`. |
| `src/pwa/useOnlineStatus.ts` | Hook para detección reactiva del estado de conexión (`navigator.onLine`). |
| `src/pwa/usePWAInstall.ts` | Hook para capturar el evento `beforeinstallprompt` y disparar la instalación PWA. |
| `src/app/providers/PWAProvider.tsx` | Contexto que unifica estado de red, instalación PWA y ciclo de vida del Service Worker. |
| `src/app/layout/Topbar.tsx` | Barra superior con branding BPE, indicador de conectividad, selector de tema y botón de instalación. |
| `src/app/layout/OfflineBanner.tsx` | Banner de alerta offline y banner de actualización de nueva versión del Service Worker. |
| `src/app/layout/BottomNav.tsx` | Barra de navegación inferior móvil (`Dashboard`, `Transacciones`, `Presupuestos`, `Cuentas`). |
| `src/app/layout/Sidebar.tsx` | Barra lateral para pantallas de escritorio (`md:flex`). |
| `src/app/layout/AppLayout.tsx` | Contenedor principal que ensambla `Topbar`, `Sidebar`, `OfflineBanner`, `BottomNav` y `Outlet`. |
| `src/app/router.tsx` | Configuración de rutas con React Router (`/`, `/transactions`, `/budgets`, `/accounts`). |
| `src/app/App.tsx` | Punto de entrada con proveedores (`ThemeProvider`, `PWAProvider`) y `RouterProvider`. |

---

### Task 1: ThemeProvider & Theme Toggle (`src/app/providers/ThemeProvider.tsx`)

**Files:**
- Create: `src/app/providers/ThemeProvider.tsx`
- Test: `src/app/providers/ThemeProvider.test.tsx`

**Interfaces:**
- Produces:
  - `type Theme = 'light' | 'dark' | 'system'`
  - `type ResolvedTheme = 'light' | 'dark'`
  - `interface ThemeContextValue { theme: Theme; resolvedTheme: ResolvedTheme; setTheme: (theme: Theme) => void }`
  - `export function ThemeProvider({ children, defaultTheme }: { children: ReactNode; defaultTheme?: Theme })`
  - `export function useTheme(): ThemeContextValue`

- [ ] **Step 1: Write failing test in `src/app/providers/ThemeProvider.test.tsx`**
  Probar renderizado con tema por defecto (`dark`), cambio de tema, persistencia en `localStorage` y aplicación de clase `.dark` en `document.documentElement`.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/app/providers/ThemeProvider.test.tsx`
  Expected: FAIL con "ThemeProvider not found"
- [ ] **Step 3: Implement `ThemeProvider` in `src/app/providers/ThemeProvider.tsx`**
  Implementar contexto con soporte de listener `matchMedia('(prefers-color-scheme: dark)')` para el modo `system`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/app/providers/ThemeProvider.test.tsx`
  Expected: PASS
- [ ] **Step 5: Commit**
  `git commit -m "feat(ui): implement ThemeProvider with dark/light/system support"`

---

### Task 2: PWA Hooks & PWAProvider (`src/pwa/` & `src/app/providers/PWAProvider.tsx`)

**Files:**
- Create: `src/pwa/useOnlineStatus.ts`
- Create: `src/pwa/usePWAInstall.ts`
- Create: `src/app/providers/PWAProvider.tsx`
- Test: `src/app/providers/PWAProvider.test.tsx`

**Interfaces:**
- Produces:
  - `function useOnlineStatus(): boolean`
  - `interface PWAInstallState { canInstall: boolean; isInstalled: boolean; promptInstall: () => Promise<boolean> }`
  - `function usePWAInstall(): PWAInstallState`
  - `interface PWAContextValue { isOnline: boolean; canInstall: boolean; isInstalled: boolean; needRefresh: boolean; promptInstall: () => Promise<boolean>; updateServiceWorker: (reloadPage?: boolean) => Promise<void> }`
  - `export function PWAProvider({ children }: { children: ReactNode })`
  - `export function usePWA(): PWAContextValue`

- [ ] **Step 1: Write failing test in `src/app/providers/PWAProvider.test.tsx`**
  Probar simulación de desconexión / reconexión (`window.dispatchEvent(new Event('offline'))`), captura de `beforeinstallprompt` y disparador de actualización de Service Worker.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/app/providers/PWAProvider.test.tsx`
  Expected: FAIL
- [ ] **Step 3: Implement `useOnlineStatus`, `usePWAInstall` and `PWAProvider`**
  Conectar `initServiceWorker` con `onNeedRefresh` para alertar cuando haya una nueva versión lista.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/app/providers/PWAProvider.test.tsx`
  Expected: PASS
- [ ] **Step 5: Commit**
  `git commit -m "feat(pwa): implement PWAProvider, useOnlineStatus and usePWAInstall"`

---

### Task 3: Componentes de Layout (`src/app/layout/`)

**Files:**
- Create: `src/app/layout/Topbar.tsx`
- Create: `src/app/layout/OfflineBanner.tsx`
- Create: `src/app/layout/BottomNav.tsx`
- Create: `src/app/layout/Sidebar.tsx`
- Create: `src/app/layout/AppLayout.tsx`
- Test: `src/app/layout/AppLayout.test.tsx`

**Interfaces:**
- Produces:
  - `export function Topbar()`
  - `export function OfflineBanner()`
  - `export function BottomNav()`
  - `export function Sidebar()`
  - `export function AppLayout()`

- [ ] **Step 1: Write failing test in `src/app/layout/AppLayout.test.tsx`**
  Probar renderizado de `AppLayout`: presencia de Topbar con branding, visualización del banner cuando `isOnline = false`, botón de instalación cuando `canInstall = true`, navegación móvil y navegación lateral de escritorio.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/app/layout/AppLayout.test.tsx`
  Expected: FAIL
- [ ] **Step 3: Implement Layout components**
  Diseñar con la estética Google Stitch:
  - `Topbar`: Logo BPE, indicador online/offline (`bg-primary` vs `bg-error`), botón de instalación PWA con icono `download`, selector de tema (`light_mode` / `dark_mode`), acciones de notificación y perfil.
  - `OfflineBanner`: Banner superior animado cuando se pierde conexión y barra emergente cuando `needRefresh === true` con botón de recarga.
  - `BottomNav`: Barra inferior móvil con `pb-safe`, iconos Material/Lucide y selector de ruta.
  - `Sidebar`: Barra lateral para pantallas medianas/grandes (`hidden md:flex`) con navegación vertical limpia.
  - `AppLayout`: Envoltorio con `<Outlet />`.
- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run src/app/layout/AppLayout.test.tsx`
  Expected: PASS
- [ ] **Step 5: Commit**
  `git commit -m "feat(ui): implement AppLayout with Topbar, Sidebar, BottomNav and OfflineBanner"`

---

### Task 4: React Router & App Shell Integration (`src/app/router.tsx` & `App.tsx`)

**Files:**
- Create: `src/app/router.tsx`
- Modify: `src/features/dashboard/DashboardPage.tsx` (extraer layout duplicado para montarse dentro de `AppLayout`)
- Create: Placeholder pages:
  - `src/features/transactions/TransactionsPage.tsx`
  - `src/features/budgets/BudgetsPage.tsx`
  - `src/features/accounts/AccountsPage.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`

- [ ] **Step 1: Write failing tests in `src/app/App.test.tsx`**
  Probar navegación entre `/`, `/transactions`, `/budgets`, `/accounts`, conmutación de tema y banner offline.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/app/App.test.tsx`
  Expected: FAIL
- [ ] **Step 3: Implement router and integrate in App.tsx**
  Configurar `createBrowserRouter` con `AppLayout` como ruta raíz y subrutas para Dashboard, Transacciones, Presupuestos y Cuentas.
- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest run src/app/App.test.tsx`
  Expected: PASS
- [ ] **Step 5: Commit**
  `git commit -m "feat(app): configure React Router shell with modules and PWA providers"`

---

### Task 5: Verificación Integral del Build y Suite Completa

**Files:**
- All Phase 3 files.

- [ ] **Step 1: Run typecheck**
  Run: `npm run typecheck`
  Expected: PASS sin errores
- [ ] **Step 2: Run full test suite & coverage**
  Run: `npm test && npm run test:coverage`
  Expected: 100% de tests pasando y 100% de cobertura en dominio
- [ ] **Step 3: Run production PWA build**
  Run: `npm run build`
  Expected: PASS con assets precacheados y service worker generado
- [ ] **Step 4: Commit**
  `git commit -m "chore(pwa): verify and complete Phase 3 UI shell and PWA controls"`
