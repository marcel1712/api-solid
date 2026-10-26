import { vi } from "vitest";
import { normalizeCnpj } from "@/utils/cnpj";

/** A valid CNPJ the fake Receita has never heard of. */
export const UNKNOWN_CNPJ = "11222333000181";

// e2e specs register orgs through the real controller; without this, every
// signup would call BrasilAPI over the network.
vi.mock("@/lib/cnpj-lookup", () => ({
  BrasilApiCnpjLookup: class {
    async find(cnpj: string) {
      if (normalizeCnpj(cnpj) === UNKNOWN_CNPJ) return null;
      return {
        legalName: "ASSOCIACAO PROTETORA DOS ANIMAIS DE TESTE",
        tradeName: null,
        registrationStatus: "ATIVA",
        legalNatureCode: 3999,
        legalNature: "Associação Privada",
        city: "SAO CARLOS",
        state: "SP",
        mainActivity: "Atividades de associações de defesa de direitos sociais",
        openedAt: "2015-03-10",
      };
    }
  },
}));
