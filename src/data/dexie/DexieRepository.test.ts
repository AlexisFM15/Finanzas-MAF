import 'fake-indexeddb/auto';
import { runRepositoryContractTests } from '../repositoryContract';
import { createDexieRepository } from './DexieRepository';

let dbCounter = 0;

runRepositoryContractTests(
  'DexieRepository (IndexedDB)',
  async () => {
    dbCounter += 1;
    return createDexieRepository(`test-financial-db-${Date.now()}-${dbCounter}`);
  },
  async (repo) => {
    await repo.clearAll();
  }
);
