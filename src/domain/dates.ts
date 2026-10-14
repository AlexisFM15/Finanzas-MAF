import type { ISODate, YearMonth } from './models';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const YEAR_MONTH_REGEX = /^(\d{4})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return DAYS_IN_MONTH[month]!;
}



/** Extrae 'YYYY-MM' de un 'YYYY-MM-DD'. Valida formato. */
export function toYearMonth(date: ISODate): YearMonth {
  const match = ISO_DATE_REGEX.exec(date);
  if (!match) {
    throw new RangeError(`Fecha ISO inválida (se esperaba YYYY-MM-DD): "${date}"`);
  }
  return `${match[1]}-${match[2]}`;
}

/** Suma o resta meses a un 'YYYY-MM' conservando formato. */
export function addMonthsToYearMonth(month: YearMonth, n: number): YearMonth {
  if (!Number.isSafeInteger(n)) {
    throw new RangeError(`El desplazamiento de meses debe ser un entero (recibido: ${n})`);
  }
  const match = YEAR_MONTH_REGEX.exec(month);
  if (!match) {
    throw new RangeError(`Mes inválido (se esperaba YYYY-MM): "${month}"`);
  }

  const y = Number.parseInt(match[1]!, 10);
  const m = Number.parseInt(match[2]!, 10);

  // Convertimos a base 0 de meses totales
  const totalMonths = y * 12 + (m - 1) + n;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12 + 12) % 12 + 1;

  const yStr = String(newYear).padStart(4, '0');
  const mStr = String(newMonth).padStart(2, '0');
  return `${yStr}-${mStr}`;
}

/** Genera la lista inclusiva de 'YYYY-MM' entre `from` y `to`. Si `from > to`, devuelve `[]`. */
export function monthRange(from: YearMonth, to: YearMonth): YearMonth[] {
  if (from > to) return [];
  const result: YearMonth[] = [];
  let current = from;
  while (current <= to) {
    result.push(current);
    current = addMonthsToYearMonth(current, 1);
  }
  return result;
}

/** Suma o resta meses a una fecha ISO acotando el día al último del mes de destino. */
export function addMonthsToDate(date: ISODate, n: number): ISODate {
  const match = ISO_DATE_REGEX.exec(date);
  if (!match) {
    throw new RangeError(`Fecha ISO inválida (se esperaba YYYY-MM-DD): "${date}"`);
  }

  const day = Number.parseInt(match[3]!, 10);
  const ym = `${match[1]}-${match[2]}`;
  const newYm = addMonthsToYearMonth(ym, n);

  const [yStr, mStr] = newYm.split('-');
  const newYear = Number.parseInt(yStr!, 10);
  const newMonth = Number.parseInt(mStr!, 10);

  const maxDay = daysInMonth(newYear, newMonth);
  const clampedDay = Math.min(day, maxDay);

  const dStr = String(clampedDay).padStart(2, '0');
  return `${newYm}-${dStr}`;
}
