export function TransactionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col space-y-space-lg px-gutter pb-space-xl">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-space-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Transacciones</h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Registro, filtros y autocategorización
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-variant/40 bg-surface-container-low p-space-md text-center shadow-md">
        <span className="material-symbols-outlined text-4xl text-primary mb-2">swap_horiz</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Módulo de Transacciones</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Próximamente en la Fase 5: tabla de movimientos con filtros avanzados, búsqueda y modal de creación con autocategorización inteligente.
        </p>
      </div>
    </div>
  );
}
