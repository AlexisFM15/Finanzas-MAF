export function AccountsPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col space-y-space-lg px-gutter pb-space-xl">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-space-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <span className="material-symbols-outlined text-[24px]">credit_card</span>
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Cuentas</h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Cuentas bancarias, tarjetas y préstamos
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-variant/40 bg-surface-container-low p-space-md text-center shadow-md">
        <span className="material-symbols-outlined text-4xl text-secondary mb-2">account_balance</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Módulo de Cuentas</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Próximamente en la Fase 4: tarjetas por tipo de cuenta, CRUD completo, cálculo de límites y cuadro de amortización para préstamos.
        </p>
      </div>
    </div>
  );
}
