import { runRepositoryContractTests } from '../repositoryContract';
import { MemoryRepository } from './MemoryRepository';

runRepositoryContractTests('MemoryRepository', async () => new MemoryRepository());
