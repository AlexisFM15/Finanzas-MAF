import { normalizeText } from './categories';
import type { Cents, ID, ISODate, Transaction, TransactionType } from './models';

export interface TransactionFilter {
  search?: string | undefined;
  types?: readonly TransactionType[] | undefined;
  accountIds?: readonly ID[] | undefined;
  categoryIds?: readonly (ID | null)[] | undefined;
  dateFrom?: ISODate | undefined;
  dateTo?: ISODate | undefined;
  minAmount?: Cents | undefined;
  maxAmount?: Cents | undefined;
}

export interface TransactionSort {
  by: 'date' | 'amount';
  direction: 'asc' | 'desc';
}

/**
 * Filtra transacciones basándose en criterios combinados (intersección AND).
 * Devuelve un nuevo array sin mutar la entrada.
 */
export function filterTransactions(
  transactions: readonly Transaction[],
  filter: TransactionFilter,
): Transaction[] {
  const normalizedSearch = filter.search ? normalizeText(filter.search) : '';

  return transactions.filter((tx) => {
    // 1. Búsqueda de texto en descripción o notas
    if (normalizedSearch) {
      const descNorm = normalizeText(tx.description);
      const notesNorm = tx.notes ? normalizeText(tx.notes) : '';
      if (!descNorm.includes(normalizedSearch) && !notesNorm.includes(normalizedSearch)) {
        return false;
      }
    }

    // 2. Tipo de transacción
    if (filter.types && filter.types.length > 0) {
      if (!filter.types.includes(tx.type)) {
        return false;
      }
    }

    // 3. Cuentas (coincide cuenta de origen o destino)
    if (filter.accountIds && filter.accountIds.length > 0) {
      const matchesOrigin = filter.accountIds.includes(tx.accountId);
      const matchesDest = tx.toAccountId ? filter.accountIds.includes(tx.toAccountId) : false;
      if (!matchesOrigin && !matchesDest) {
        return false;
      }
    }

    // 4. Categorías
    if (filter.categoryIds && filter.categoryIds.length > 0) {
      if (!filter.categoryIds.includes(tx.categoryId)) {
        return false;
      }
    }

    // 5. Rango de fechas
    if (filter.dateFrom && tx.date < filter.dateFrom) {
      return false;
    }
    if (filter.dateTo && tx.date > filter.dateTo) {
      return false;
    }

    // 6. Rango de importes
    if (filter.minAmount !== undefined && tx.amount < filter.minAmount) {
      return false;
    }
    if (filter.maxAmount !== undefined && tx.amount > filter.maxAmount) {
      return false;
    }

    return true;
  });
}

/**
 * Ordena transacciones por fecha o importe.
 * Desempata por `createdAt` y luego por `id`.
 * Devuelve un nuevo array sin mutar la entrada.
 */
export function sortTransactions(
  transactions: readonly Transaction[],
  sort: TransactionSort = { by: 'date', direction: 'desc' },
): Transaction[] {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...transactions].sort((a, b) => {
    if (sort.by === 'date') {
      const cmpDate = a.date.localeCompare(b.date);
      if (cmpDate !== 0) return cmpDate * factor;
    } else {
      if (a.amount !== b.amount) {
        return (a.amount - b.amount) * factor;
      }
    }

    // Desempate 1: createdAt
    const cmpCreated = a.createdAt.localeCompare(b.createdAt);
    if (cmpCreated !== 0) return cmpCreated * factor;

    // Desempate 2: id
    return a.id.localeCompare(b.id) * factor;
  });
}
