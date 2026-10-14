import { runRepositoryContractTests } from '../repository.contract.test';
import { MemoryRepository } from './MemoryRepository';

runRepositoryContractTests('MemoryRepository', async () => new MemoryRepository());
