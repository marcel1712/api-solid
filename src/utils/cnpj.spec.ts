import { describe, expect, it } from "vitest";
import { isValidCnpj, normalizeCnpj } from "./cnpj";
import { buildCnpjCheck } from "./cnpj-check";

describe("CNPJ", () => {
  it("should accept a valid CNPJ with or without punctuation", () => {
    expect(isValidCnpj("00000000000191")).toBe(true);
    expect(isValidCnpj("00.000.000/0001-91")).toBe(true);
  });

  it("should reject wrong check digits, wrong lengths and repeated digits", () => {
    expect(isValidCnpj("00000000000192")).toBe(false);
    expect(isValidCnpj("0000000000019")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("should keep only digits", () => {
    expect(normalizeCnpj("00.000.000/0001-91")).toEqual("00000000000191");
  });
});

describe("CNPJ check", () => {
  const record = {
    legalName: "ASSOCIACAO PROTETORA",
    tradeName: null,
    registrationStatus: "ATIVA",
    legalNatureCode: 3999,
    legalNature: "Associação Privada",
    city: "SAO PAULO",
    state: "SP",
    mainActivity: "Atividades de associações",
    openedAt: "2015-03-10",
  };

  it("should flag an active non-profit in the declared city", () => {
    expect(buildCnpjCheck(record, "São Paulo").flags).toEqual({
      active: true,
      nonProfit: true,
      cityMatches: true,
    });
  });

  it("should flag what doesn't match", () => {
    const check = buildCnpjCheck(
      { ...record, registrationStatus: "BAIXADA", legalNatureCode: 2062 },
      "Recife",
    );

    expect(check.flags).toEqual({
      active: false,
      nonProfit: false,
      cityMatches: false,
    });
  });
});
