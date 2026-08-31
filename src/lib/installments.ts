export interface Installment {
  index: number;
  total: number;
}

/**
 * Splits a total into `months` equal installments, rounded to cents. Any
 * rounding remainder is absorbed by the last installment so the sum always
 * equals the original total exactly.
 */
export function calculateInstallments(total: number, months: number): Installment[] {
  const base = Math.round((total / months) * 100) / 100;
  const installments: Installment[] = Array.from({ length: months }, (_, i) => ({
    index: i + 1,
    total: base,
  }));

  const lastTotal = Math.round((total - base * (months - 1)) * 100) / 100;
  installments[months - 1] = { index: months, total: lastTotal };

  return installments;
}
