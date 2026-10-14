import { NavLink } from 'react-router';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'account_balance_wallet' },
  { to: '/transactions', label: 'Transacciones', icon: 'receipt_long' },
  { to: '/budgets', label: 'Presupuestos', icon: 'donut_large' },
  { to: '/accounts', label: 'Cuentas', icon: 'credit_card' },
];

export function BottomNav() {
  return (
    <nav
      id="bottom-navigation"
      aria-label="Navegación móvil"
      className="fixed bottom-0 z-40 w-full border-t border-surface-variant/40 bg-surface/90 pb-safe shadow-[0_-1px_12px_rgba(0,0,0,0.2)] backdrop-blur-xl md:hidden transition-colors duration-200"
    >
      <div className="flex h-16 items-center justify-around px-space-xs">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-space-xs transition-colors focus:outline-none ${
                isActive
                  ? 'font-semibold text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
            <span className="font-label-sm text-label-sm">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
