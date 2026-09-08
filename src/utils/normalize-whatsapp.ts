/**
 * Normalizes a Brazilian phone number into E.164 (e.g. "+5511989731163").
 * Accepts formatted local numbers ("(11) 98973-1163"), bare digits
 * ("11989731163"), numbers already carrying the country code
 * ("5511989731163"), and already-E.164 values ("+5511989731163" or
 * any other country's "+..." number, left untouched but for stripped
 * formatting characters).
 */
export function normalizeWhatsapp(input: string): string {
  const trimmed = input.trim();
  const hasCountryCallingPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (hasCountryCallingPrefix) {
    return `+${digits}`;
  }

  const alreadyHasBrazilCountryCode =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13);

  return alreadyHasBrazilCountryCode ? `+${digits}` : `+55${digits}`;
}
