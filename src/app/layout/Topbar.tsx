import { usePWA } from '../providers/PWAProvider';
import { useTheme } from '../providers/ThemeProvider';

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { isOnline, canInstall, promptInstall } = usePWA();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      role="banner"
      id="app-header"
      className="fixed top-0 z-40 w-full bg-surface/80 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-colors duration-200"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-gutter">
        {/* Logo & Marca */}
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm leading-tight tracking-tight text-on-surface">
              BPE
            </span>
            <span className="font-label-sm text-label-sm leading-none text-on-surface-variant">
              Dashboard
            </span>
          </div>
        </div>

        {/* Acciones & Controles PWA */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Indicador Online/Offline */}
          <div
            title={isOnline ? 'Conexión activa' : 'Sin conexión — Modo offline'}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              isOnline
                ? 'bg-primary/15 text-primary'
                : 'bg-error/15 text-error font-semibold animate-pulse'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-primary' : 'bg-error animate-ping'
              }`}
            />
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Botón Instalar PWA */}
          {canInstall && (
            <button
              id="install-pwa-button"
              type="button"
              onClick={() => promptInstall()}
              aria-label="Instalar app"
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary shadow-sm transition-transform hover:opacity-95 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          {/* Selector de Tema */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px]">
              {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notificaciones */}
          <button
            id="notifications-button"
            type="button"
            aria-label="Notificaciones"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>

          {/* Perfil */}
          <button
            id="profile-button"
            type="button"
            aria-label="Perfil de usuario"
            className="flex h-10 w-10 items-center justify-center rounded-full p-1 focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high text-xs font-semibold text-primary">
              JD
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
