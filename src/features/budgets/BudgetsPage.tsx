export function BudgetsPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col space-y-space-lg px-gutter pb-space-xl">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-space-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/15 text-tertiary">
            <span className="material-symbols-outlined text-[24px]">donut_large</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Presupuestos y Metas</h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Límites mensuales y objetivos de ahorro
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-variant/40 bg-surface-container-low p-space-md text-center shadow-md">
        <span className="material-symbols-outlined text-4xl text-tertiary mb-2">savings</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Módulo de Presupuestos</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Próximamente en la Fase 7: gestión de presupuestos por categoría con umbrales de alerta y progreso de metas de ahorro.
        </p>
      </div>
    </div>
  );
}
