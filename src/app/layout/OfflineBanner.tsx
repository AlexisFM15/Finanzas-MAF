import { usePWA } from '../providers/PWAProvider';

export function OfflineBanner() {
  const { isOnline, needRefresh, updateServiceWorker } = usePWA();

  return (
    <div className="fixed top-16 left-0 z-30 w-full flex flex-col items-center pointer-events-none px-4">
      {/* Banner Sin Conexión */}
      {!isOnline && (
        <div
          role="status"
          className="pointer-events-auto mt-2 flex items-center gap-2 rounded-full border border-error/30 bg-surface-container-high/95 px-4 py-1.5 text-xs text-error shadow-lg backdrop-blur-md animate-fade-up"
        >
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          <span className="font-medium">
            Modo sin conexión · Tus datos se guardan de forma segura en este dispositivo
          </span>
        </div>
      )}

      {/* Banner Nueva Versión PWA */}
      {needRefresh && (
        <div
          role="alert"
          className="pointer-events-auto mt-2 flex items-center gap-3 rounded-full border border-primary/40 bg-surface-container-highest px-4 py-1.5 text-xs text-on-surface shadow-xl backdrop-blur-md animate-fade-up"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">update</span>
          <span className="font-medium">Nueva versión disponible</span>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="rounded-full bg-primary px-3 py-1 font-semibold text-on-primary transition-opacity hover:opacity-95 focus:outline-none"
          >
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
