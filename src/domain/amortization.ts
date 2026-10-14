import { addMonthsToDate } from './dates';
import type { Cents, ISODate, LoanTerms } from './models';
import { assertCents, roundHalfAwayFromZero, sumCents } from './money';

export interface AmortizationRow {
  period: number;
  date: ISODate;
  payment: Cents;
  interest: Cents;
  principal: Cents;
  balance: Cents;
}

function validateLoanTerms(terms: LoanTerms): void {
  assertCents(terms.principal, 'principal del préstamo');
  if (terms.principal <= 0) {
    throw new RangeError('El principal del préstamo debe ser mayor que 0');
  }

  if (!Number.isSafeInteger(terms.termMonths) || terms.termMonths <= 0) {
    throw new RangeError(`El plazo en meses debe ser un entero positivo (recibido: ${terms.termMonths})`);
  }

  if (!Number.isFinite(terms.annualRate) || terms.annualRate < 0) {
    throw new RangeError(`La tasa anual debe ser un número finito mayor o igual a 0 (recibido: ${terms.annualRate})`);
  }
}

/**
 * Calcula la cuota mensual periódica constante del método francés redondeada a céntimos enteros.
 */
export function monthlyPayment(terms: LoanTerms): Cents {
  validateLoanTerms(terms);

  const r = terms.annualRate / 12;
  const n = terms.termMonths;
  const P = terms.principal;

  if (r === 0) {
    return assertCents(roundHalfAwayFromZero(P / n));
  }

  const factor = Math.pow(1 + r, -n);
  const payment = (P * r) / (1 - factor);
  return assertCents(roundHalfAwayFromZero(payment));
}

/**
 * Genera la tabla de amortización por el método francés.
 * Todos los importes (pago, interés, amortización, saldo) se representan en céntimos enteros.
 * En la última cuota, se ajusta la amortización para garantizar que el saldo final sea exactamente 0.
 */
export function amortizationSchedule(terms: LoanTerms): AmortizationRow[] {
  validateLoanTerms(terms);

  const standardPayment = monthlyPayment(terms);
  const r = terms.annualRate / 12;
  const rows: AmortizationRow[] = [];

  let currentBalance = terms.principal;

  for (let k = 1; k <= terms.termMonths; k++) {
    const isLastPeriod = k === terms.termMonths;
    const interest = assertCents(roundHalfAwayFromZero(currentBalance * r), 'interés');

    let principal: Cents;
    let payment: Cents;

    if (isLastPeriod) {
      principal = currentBalance;
      payment = sumCents([interest, principal]);
    } else {
      principal = assertCents(roundHalfAwayFromZero(standardPayment - interest), 'amortización');
      payment = standardPayment;
    }

    currentBalance = sumCents([currentBalance, -principal]);
    const date = addMonthsToDate(terms.startDate, k);

    rows.push({
      period: k,
      date,
      payment,
      interest,
      principal,
      balance: currentBalance,
    });
  }

  return rows;
}
