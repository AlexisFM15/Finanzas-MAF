import type { Cents, CurrencyCode } from './models';

/** Redondeo monetario: las mitades se alejan de cero (2.5 → 3, -2.5 → -3). Nunca devuelve -0. */
export function roundHalfAwayFromZero(value: number): number {
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return rounded === 0 ? 0 : rounded;
}

/** `true` si el valor es un entero seguro (unidades menores válidas). */
export function isCents(value: unknown): value is Cents {
  return Number.isSafeInteger(value);
}

/** Devuelve el valor si son céntimos válidos; si no, lanza `RangeError`. */
export function assertCents(value: number, label = 'importe'): Cents {
  if (!isCents(value)) {
    throw new RangeError(`El ${label} debe ser un entero seguro en céntimos (recibido: ${value})`);
  }
  return value;
}

/** Suma una lista de importes en céntimos asegurando exactitud y validación. */
export function sumCents(values: readonly Cents[]): Cents {
  let total = 0;
  for (const v of values) {
    assertCents(v);
    total += v;
  }
  return assertCents(total, 'resultado de la suma');
}

/** Multiplica un importe en céntimos por un factor escalar finito y redondea con half-away-from-zero. */
export function multiplyCents(amount: Cents, factor: number): Cents {
  assertCents(amount);
  if (!Number.isFinite(factor)) {
    throw new RangeError(`El factor debe ser un número finito (recibido: ${factor})`);
  }
  const result = roundHalfAwayFromZero(amount * factor);
  return assertCents(result, 'resultado de la multiplicación');
}

/** Devuelve el número de decimales (fracciones menores) de una divisa según Intl. */
export function currencyFractionDigits(currency: CurrencyCode): number {
  try {
    const formatter = new Intl.NumberFormat('en', { style: 'currency', currency });
    return formatter.resolvedOptions().maximumFractionDigits!;
  } catch {
    throw new RangeError(`Código de moneda ISO 4217 inválido: ${currency}`);
  }
}


/**
 * Parsea un string a céntimos (o unidades menores de la divisa).
 * Rechaza separadores de miles para evitar ambigüedades. Acepta coma o punto decimal.
 */
export function parseMoney(input: string, currency: CurrencyCode = 'EUR'): Cents {
  const digits = currencyFractionDigits(currency);
  const trimmed = input.trim();

  if (!trimmed) {
    throw new RangeError('El importe no puede estar vacío');
  }

  // Regex estricto: signo opcional, parte entera, y opcionalmente separador decimal con hasta `digits` decimales
  const pattern = digits === 0
    ? /^-?\d+$/
    : new RegExp(`^-?\\d+([.,]\\d{1,${digits}})?$`);

  if (!pattern.test(trimmed)) {
    throw new RangeError(`Formato de importe no válido o demasiados decimales para ${currency}: "${input}"`);
  }

  const normalized = trimmed.replace(',', '.');
  const isNegative = normalized.startsWith('-');
  const unsigned = isNegative ? normalized.slice(1) : normalized;

  const [wholePart = '0', fractionPart = ''] = unsigned.split('.');
  const paddedFraction = fractionPart.padEnd(digits, '0');

  const combinedStr = digits === 0 ? wholePart : `${wholePart}${paddedFraction}`;
  const total = Number.parseInt(combinedStr, 10);

  const finalCents = isNegative ? -total : total;
  return assertCents(finalCents);
}

/**
 * Formatea un importe en céntimos a string localizado usando exclusivamente Intl.NumberFormat.
 */
export function formatMoney(
  amount: Cents,
  currency: CurrencyCode,
  locale = 'es-ES',
): string {
  assertCents(amount);
  const digits = currencyFractionDigits(currency);

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  const decimalValue = digits === 0 ? amount : amount / Math.pow(10, digits);
  return formatter.format(decimalValue);
}
