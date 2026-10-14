import { describe, expect, it } from 'vitest';
import {
  assertCents,
  currencyFractionDigits,
  formatMoney,
  isCents,
  multiplyCents,
  parseMoney,
  roundHalfAwayFromZero,
  sumCents,
} from './money';


describe('multiplyCents', () => {
  it('multiplies cents by a factor with half-away-from-zero rounding', () => {
    expect(multiplyCents(1000, 0.15)).toBe(150);
    expect(multiplyCents(1, 0.5)).toBe(1);
    expect(multiplyCents(-1, 0.5)).toBe(-1);
    expect(multiplyCents(999, 1 / 3)).toBe(333);
  });

  it('rejects invalid cents or non-finite factor', () => {
    expect(() => multiplyCents(10.5 as any, 2)).toThrow(RangeError);
    expect(() => multiplyCents(100, Number.NaN)).toThrow(RangeError);
    expect(() => multiplyCents(100, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('currencyFractionDigits', () => {
  it('returns standard decimal places for currencies', () => {
    expect(currencyFractionDigits('EUR')).toBe(2);
    expect(currencyFractionDigits('USD')).toBe(2);
    expect(currencyFractionDigits('JPY')).toBe(0);
    expect(currencyFractionDigits('KWD')).toBe(3);
  });

  it('throws RangeError for invalid currency code', () => {
    expect(() => currencyFractionDigits('INVALID')).toThrow(RangeError);
  });
});

describe('parseMoney', () => {
  it('parses valid integer and decimal strings into cents', () => {
    expect(parseMoney('12')).toBe(1200);
    expect(parseMoney('12.3')).toBe(1230);
    expect(parseMoney('12,34')).toBe(1234);
    expect(parseMoney(' -7.50 ')).toBe(-750);
    expect(parseMoney('0')).toBe(0);
    expect(parseMoney('1500', 'JPY')).toBe(1500);
  });

  it('rejects invalid formats, thousand separators, and fractional digits beyond currency', () => {
    expect(() => parseMoney('')).toThrow(RangeError);
    expect(() => parseMoney('abc')).toThrow(RangeError);
    expect(() => parseMoney('1.234')).toThrow(RangeError); // 3 decimals for EUR
    expect(() => parseMoney('1.2.3')).toThrow(RangeError);
    expect(() => parseMoney('1e3')).toThrow(RangeError);
    expect(() => parseMoney('15.5', 'JPY')).toThrow(RangeError); // JPY has 0 decimals
  });
});

describe('formatMoney', () => {
  const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

  it('formats cents using Intl.NumberFormat', () => {
    expect(norm(formatMoney(1234567, 'EUR', 'es-ES'))).toBe('12.345,67 €');
    expect(norm(formatMoney(123450, 'EUR', 'es-ES'))).toBe('1234,50 €');
    expect(norm(formatMoney(-1234, 'EUR', 'es-ES'))).toBe('-12,34 €');
    expect(norm(formatMoney(0, 'EUR', 'es-ES'))).toBe('0,00 €');
    expect(norm(formatMoney(123456, 'USD', 'en-US'))).toBe('$1,234.56');
    expect(norm(formatMoney(1500, 'JPY', 'es-ES'))).toBe('1500 JPY');
  });

  it('rejects non-integer cents', () => {
    expect(() => formatMoney(12.34 as any, 'EUR')).toThrow(RangeError);
  });
});

describe('sumCents', () => {
  it('returns 0 for an empty list', () => {
    expect(sumCents([])).toBe(0);
  });

  it('adds positive and negative amounts exactly', () => {
    expect(sumCents([100, -50, 25])).toBe(75);
  });

  it('rejects any non-integer amount', () => {
    expect(() => sumCents([100, 0.5])).toThrow(RangeError);
  });
});

describe('isCents', () => {
  it('accepts safe integers', () => {
    expect(isCents(100)).toBe(true);
    expect(isCents(-250)).toBe(true);
    expect(isCents(0)).toBe(true);
  });

  it('rejects non-integers, non-finite, unsafe and non-numbers', () => {
    for (const value of [12.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, '100', null]) {
      expect(isCents(value)).toBe(false);
    }
  });
});

describe('assertCents', () => {
  it('returns the value when it is valid cents', () => {
    expect(assertCents(100)).toBe(100);
  });

  it('throws a RangeError naming the label for floats', () => {
    expect(() => assertCents(12.5, 'importe')).toThrow(RangeError);
    expect(() => assertCents(12.5, 'importe')).toThrow(/importe.*entero/);
  });
});


describe('roundHalfAwayFromZero', () => {
  it('rounds halves away from zero for both signs', () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });

  it('rounds non-halves to the nearest integer', () => {
    expect(roundHalfAwayFromZero(2.4)).toBe(2);
    expect(roundHalfAwayFromZero(-2.6)).toBe(-3);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundHalfAwayFromZero(-0.4), -0)).toBe(false);
    expect(roundHalfAwayFromZero(-0.4)).toBe(0);
  });
});
