import { describe, expect, it } from 'vitest';
import { makeCategory } from '@/test/factories';
import { normalizeText, suggestCategory } from './categories';

describe('normalizeText', () => {
  it('removes accents, normalizes symbols and collapses whitespace', () => {
    expect(normalizeText('  CAFÉ  Central!! ')).toBe('cafe central');
    expect(normalizeText('Pingüino-Ñandú')).toBe('pinguino nandu');
  });

  it('handles empty or whitespace-only strings', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });
});

describe('suggestCategory', () => {
  it('suggests matching category by keyword ignoring casing and accents', () => {
    const restaurant = makeCategory({
      name: 'Restaurantes',
      kind: 'expense',
      keywords: ['cafe'],
    });

    const suggestion = suggestCategory('CAFÉ Central', 'expense', [restaurant]);
    expect(suggestion?.name).toBe('Restaurantes');
    expect(suggestCategory('', 'expense', [restaurant])).toBeNull();
    expect(suggestCategory('   ', 'expense', [restaurant])).toBeNull();
  });


  it('does not match partial substrings (prevents false positives)', () => {
    const bar = makeCategory({
      name: 'Bares',
      kind: 'expense',
      keywords: ['bar'],
    });

    // "Barbería" should not match keyword "bar"
    expect(suggestCategory('Barbería Paco', 'expense', [bar])).toBeNull();
  });

  it('matches multi-word keywords as a phrase', () => {
    const food = makeCategory({
      name: 'Comida a domicilio',
      kind: 'expense',
      keywords: ['uber eats'],
    });

    const suggestion = suggestCategory('Pedido UBER EATS 123', 'expense', [food]);
    expect(suggestion?.name).toBe('Comida a domicilio');
  });

  it('filters strictly by category kind (income vs expense)', () => {
    const salary = makeCategory({
      name: 'Nómina',
      kind: 'income',
      keywords: ['nomina'],
    });

    // Asking for expense should never suggest an income category
    expect(suggestCategory('Ingreso nómina enero', 'expense', [salary])).toBeNull();
  });

  it('prioritizes the longest matching keyword in case of overlaps', () => {
    const transport = makeCategory({
      name: 'Transporte',
      kind: 'expense',
      keywords: ['uber'],
    });
    const food = makeCategory({
      name: 'Comida',
      kind: 'expense',
      keywords: ['uber eats'],
    });

    // "uber eats" (length 9) beats "uber" (length 4)
    const suggestion = suggestCategory('Cena de Uber Eats', 'expense', [transport, food]);
    expect(suggestion?.name).toBe('Comida');
  });

  it('breaks ties using list order and ignores empty keywords', () => {
    const catA = makeCategory({ name: 'A', kind: 'expense', keywords: ['gym', ''] });
    const catB = makeCategory({ name: 'B', kind: 'expense', keywords: ['gym'] });

    expect(suggestCategory('Cuota gym', 'expense', [catA, catB])?.name).toBe('A');
  });
});
