import { Landmark, PiggyBank, ReceiptText, WalletCards, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ModulePreview {
  icon: LucideIcon;
  title: string;
  description: string;
}

const MODULES: readonly ModulePreview[] = [
  { icon: WalletCards, title: 'Dashboard', description: 'Balance, ingresos vs. gastos' },
  { icon: ReceiptText, title: 'Transacciones', description: 'Registro y autocategorización' },
  { icon: PiggyBank, title: 'Presupuestos y Metas', description: 'Límites y progreso de ahorro' },
  { icon: Landmark, title: 'Cuentas', description: 'Tarjetas, préstamos y amortización' },
];

/** Shell temporal de la Fase 0 — se sustituye por AppLayout + router en la Fase 3. */
export function App() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/25 via-accent-400/10 to-transparent blur-3xl"
      />
      <section className="relative w-full max-w-3xl animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
          <WifiOff className="size-3.5 text-brand-400" aria-hidden />
          Offline-first · Tus datos se quedan en tu dispositivo
        </span>
        <h1 className="mt-6 bg-gradient-to-r from-foreground via-foreground to-brand-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          Finanzas Personales
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted">
          Controla cuentas, transacciones, presupuestos y metas desde una app instalable que
          funciona sin conexión.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {MODULES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <Icon
                className="size-5 text-brand-400 transition-transform duration-300 group-hover:scale-110"
                aria-hidden
              />
              <h2 className="mt-3 text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
