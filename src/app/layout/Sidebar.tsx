import { NavLink } from 'react-router';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: 'account_balance_wallet',
    description: 'Resumen y finanzas',
  },
  {
    to: '/transactions',
    label: 'Transacciones',
    icon: 'receipt_long',
    description: 'Historial y registros',
  },
  {
    to: '/budgets',
    label: 'Presupuestos y Metas',
    icon: 'donut_large',
    description: 'Límites y ahorros',
  },
  {
    to: '/accounts',
    label: 'Cuentas',
    icon: 'credit_card',
    description: 'Tarjetas y préstamos',
  },
];

export function Sidebar() {
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r border-surface-variant/40 bg-surface/80 p-4 pt-20 backdrop-blur-xl md:flex transition-colors duration-200"
    >
      <nav aria-label="Navegación de escritorio" className="flex flex-col space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl p-3 transition-colors ${
                isActive
                  ? 'bg-surface-container-high font-semibold text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm leading-tight truncate">{item.label}</span>
              <span className="text-[11px] font-normal text-on-surface-variant/80 truncate">
                {item.description}
              </span>
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Tarjeta Informativa Offline-First */}
      <div className="mt-auto rounded-xl border border-surface-variant/40 bg-surface-container-low p-3.5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          <span>Offline First</span>
        </div>
        <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
          IndexedDB local. Tus finanzas privadas se quedan en tu dispositivo.
        </p>
      </div>
    </aside>
  );
}
