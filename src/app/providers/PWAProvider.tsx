import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { initServiceWorker, type UpdateServiceWorker } from '@/pwa/registerSW';
import { useOnlineStatus } from '@/pwa/useOnlineStatus';
import { usePWAInstall } from '@/pwa/usePWAInstall';

export interface PWAContextValue {
  isOnline: boolean;
  canInstall: boolean;
  isInstalled: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  promptInstall: () => Promise<boolean>;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

const PWAContext = createContext<PWAContextValue | null>(null);

export function PWAProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSWFn, setUpdateSWFn] = useState<UpdateServiceWorker>(() => async () => {});

  useEffect(() => {
    const updateFn = initServiceWorker({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
    setUpdateSWFn(() => updateFn);
  }, []);

  const updateServiceWorker = async (reloadPage: boolean = true) => {
    await updateSWFn(reloadPage);
    setNeedRefresh(false);
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        canInstall,
        isInstalled,
        needRefresh,
        offlineReady,
        promptInstall,
        updateServiceWorker,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA(): PWAContextValue {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA debe ser utilizado dentro de un PWAProvider');
  }
  return context;
}
