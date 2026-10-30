import { CnpjRecord } from "@/lib/cnpj-lookup";

// Natureza jurídica codes an animal protection NGO can have. Most are
// associations; foundations, religious organizations and OSs also appear.
const NON_PROFIT_LEGAL_NATURES = new Set([
  3999, // Associação Privada
  3069, // Fundação Privada
  3220, // Organização Religiosa
  3301, // Organização Social (OS)
]);

/**
 * What the reviewer sees about the CNPJ. It informs the decision and never
 * makes it: a flag can be off for a legitimate reason (an org that moved
 * cities, a foundation with an unusual code) and only a person can tell.
 */
export interface CnpjCheck {
  checkedAt: string;
  record: CnpjRecord | null;
  flags: {
    active: boolean;
    nonProfit: boolean;
    cityMatches: boolean;
  } | null;
}

export function isNonProfitLegalNature(code: number): boolean {
  return NON_PROFIT_LEGAL_NATURES.has(code);
}

function normalizeCity(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

export function buildCnpjCheck(
  record: CnpjRecord | null,
  declaredCity: string,
): CnpjCheck {
  return {
    checkedAt: new Date().toISOString(),
    record,
    flags: record && {
      active: record.registrationStatus.toUpperCase() === "ATIVA",
      nonProfit: NON_PROFIT_LEGAL_NATURES.has(record.legalNatureCode),
      cityMatches: normalizeCity(record.city) === normalizeCity(declaredCity),
    },
  };
}
