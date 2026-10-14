import type { BackupData } from './repository';

export function validateBackupData(data: unknown): asserts data is BackupData {
  if (!data || typeof data !== 'object') {
    throw new TypeError('Respaldo inválido: el objeto raíz debe ser un objeto.');
  }

  const candidate = data as Partial<BackupData>;

  if (
    typeof candidate.version !== 'number' ||
    candidate.version <= 0 ||
    !Number.isInteger(candidate.version)
  ) {
    throw new TypeError('Respaldo inválido: version debe ser un entero positivo.');
  }

  if (typeof candidate.exportedAt !== 'string' || !candidate.exportedAt.trim()) {
    throw new TypeError('Respaldo inválido: exportedAt debe ser una cadena no vacía.');
  }

  if (!Array.isArray(candidate.accounts)) {
    throw new TypeError('Respaldo inválido: accounts debe ser un array.');
  }

  for (const acc of candidate.accounts) {
    if (!acc || typeof acc !== 'object') {
      throw new TypeError('Respaldo inválido: cuenta inválida.');
    }
    if (typeof acc.id !== 'string' || !acc.id) {
      throw new TypeError('Respaldo inválido: cuenta sin ID.');
    }
    if (typeof acc.openingBalance !== 'number' || !Number.isInteger(acc.openingBalance)) {
      throw new TypeError(
        `Respaldo inválido: openingBalance de cuenta ${acc.id} debe ser un entero en céntimos.`
      );
    }
    if (
      acc.creditLimit !== undefined &&
      (typeof acc.creditLimit !== 'number' || !Number.isInteger(acc.creditLimit))
    ) {
      throw new TypeError(
        `Respaldo inválido: creditLimit de cuenta ${acc.id} debe ser un entero en céntimos.`
      );
    }
  }

  if (!Array.isArray(candidate.transactions)) {
    throw new TypeError('Respaldo inválido: transactions debe ser un array.');
  }

  for (const tx of candidate.transactions) {
    if (!tx || typeof tx !== 'object') {
      throw new TypeError('Respaldo inválido: transacción inválida.');
    }
    if (typeof tx.id !== 'string' || !tx.id) {
      throw new TypeError('Respaldo inválido: transacción sin ID.');
    }
    if (typeof tx.amount !== 'number' || !Number.isInteger(tx.amount) || tx.amount <= 0) {
      throw new TypeError(
        `Respaldo inválido: importe de transacción ${tx.id} debe ser un entero positivo en céntimos.`
      );
    }
  }

  if (!Array.isArray(candidate.categories)) {
    throw new TypeError('Respaldo inválido: categories debe ser un array.');
  }

  if (!Array.isArray(candidate.budgets)) {
    throw new TypeError('Respaldo inválido: budgets debe ser un array.');
  }

  for (const b of candidate.budgets) {
    if (
      typeof b.monthlyLimit !== 'number' ||
      !Number.isInteger(b.monthlyLimit) ||
      b.monthlyLimit < 0
    ) {
      throw new TypeError(
        `Respaldo inválido: monthlyLimit de presupuesto debe ser un entero no negativo.`
      );
    }
  }

  if (!Array.isArray(candidate.goals)) {
    throw new TypeError('Respaldo inválido: goals debe ser un array.');
  }

  for (const g of candidate.goals) {
    if (
      typeof g.targetAmount !== 'number' ||
      !Number.isInteger(g.targetAmount) ||
      g.targetAmount <= 0
    ) {
      throw new TypeError(`Respaldo inválido: targetAmount de meta debe ser un entero positivo.`);
    }
  }
}
