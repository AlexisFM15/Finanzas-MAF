import type { AppRepository } from './repository';
import { DexieRepository } from './dexie/DexieRepository';
import { MemoryRepository } from './memory/MemoryRepository';

export * from './repository';
export * from './backupValidation';
export * from './dexie/db';
export * from './dexie/DexieRepository';
export * from './memory/MemoryRepository';
export * from './seed';

let defaultRepoInstance: AppRepository | null = null;

/**
 * Obtiene la instancia de repositorio por defecto.
 * En navegador utiliza IndexedDB (`DexieRepository`), y en entornos sin IndexedDB
 * recurre a `MemoryRepository`.
 */
export function getDefaultRepository(): AppRepository {
  if (!defaultRepoInstance) {
    if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
      defaultRepoInstance = new DexieRepository();
    } else {
      defaultRepoInstance = new MemoryRepository();
    }
  }
  return defaultRepoInstance;
}

/** Permite restablecer la instancia singleton para pruebas. */
export function resetDefaultRepository(): void {
  defaultRepoInstance = null;
}
