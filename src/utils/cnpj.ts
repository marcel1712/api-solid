/** Keeps only the digits: accepts `12.345.678/0001-95` as well as `12345678000195`. */
export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

function checkDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce(
    (total, weight, index) => total + Number(digits[index]) * weight,
    0,
  );
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/**
 * Validates the two check digits locally, so a typo is caught before any
 * request to BrasilAPI. Sequences like `11111111111111` pass the math but are
 * never real CNPJs.
 */
export function isValidCnpj(value: string): boolean {
  const digits = normalizeCnpj(value);

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return Number(digits[12]) === first && Number(digits[13]) === second;
}
