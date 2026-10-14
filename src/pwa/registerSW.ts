import { registerSW } from 'virtual:pwa-register';

/** Callbacks del ciclo de vida del SW (consumidos por el shell UI en la Fase 3). */
export interface PWALifecycleHandlers {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegisterError?: (error: unknown) => void;
}

/** Activa el SW en espera; con `true` recarga la página tras activarlo. */
export type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

const noopUpdate: UpdateServiceWorker = async () => {};

/** Registra el Service Worker. Seguro en navegadores sin soporte (no-op). */
export function initServiceWorker(handlers: PWALifecycleHandlers = {}): UpdateServiceWorker {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return noopUpdate;
  }
  return registerSW({ immediate: true, ...handlers });
}
