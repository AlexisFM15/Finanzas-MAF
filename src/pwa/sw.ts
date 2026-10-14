/// <reference lib="webworker" />
/**
 * Service Worker — Módulo PWA Stitch.
 * Estrategias de caching de Workbox (spec §4):
 *  - Precaching del app shell (HTML, JS, CSS, fuentes, iconos) inyectado en build.
 *  - Navegación SPA offline servida desde el index.html precacheado.
 *  - StaleWhileRevalidate para assets estáticos same-origin no precacheados.
 * Los datos de usuario NO pasan por aquí: viven en IndexedDB (Dexie).
 */
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

const STATIC_DESTINATIONS: ReadonlySet<RequestDestination> = new Set([
  'style',
  'script',
  'worker',
  'font',
  'image',
]);

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin && STATIC_DESTINATIONS.has(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

// Flujo "Nueva versión disponible — Actualizar": el cliente envía SKIP_WAITING.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

clientsClaim();
