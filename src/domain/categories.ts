import type { Category } from './models';

/**
 * Normaliza un texto para búsquedas y comparación de keywords:
 * 1. Descomposición Unicode (NFD) para separar letras de tildes/diacríticos.
 * 2. Eliminación de marcas de combinación (diacríticos).
 * 3. Conversión a minúsculas.
 * 4. Sustitución de caracteres no alfanuméricos por espacios.
 * 5. Colapso de espacios múltiples y trim.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Sugiere una categoría para una descripción dada basada en coincidencia exacta de palabras clave.
 * - Solo evalúa categorías del mismo `kind` ('income' | 'expense').
 * - Requiere coincidencia de palabra completa (tokens de palabra delimitados).
 * - Prioriza el keyword coincidente más largo (más específico).
 * - En caso de empate de longitud, se mantiene el orden de aparición en el array.
 */
export function suggestCategory(
  description: string,
  kind: Category['kind'],
  categories: readonly Category[],
): Category | null {
  const normalizedDesc = normalizeText(description);
  if (!normalizedDesc) {
    return null;
  }

  // Envolvemos la descripción normalizada entre espacios para búsqueda de tokens completos
  const paddedDesc = ` ${normalizedDesc} `;

  let bestMatch: { category: Category; keywordLength: number } | null = null;

  for (const category of categories) {
    if (category.kind !== kind) {
      continue;
    }

    for (const rawKeyword of category.keywords) {
      const normalizedKeyword = normalizeText(rawKeyword);
      if (!normalizedKeyword) {
        continue;
      }

      // Verificamos si el keyword aparece como palabra/frase completa
      const targetPattern = ` ${normalizedKeyword} `;
      if (paddedDesc.includes(targetPattern)) {
        if (!bestMatch || normalizedKeyword.length > bestMatch.keywordLength) {
          bestMatch = {
            category,
            keywordLength: normalizedKeyword.length,
          };
        }
      }
    }
  }

  return bestMatch?.category ?? null;
}
