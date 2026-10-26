import { CnpjLookup, CnpjRecord } from "@/lib/cnpj-lookup";

/** BrasilAPI stand-in for unit specs: every CNPJ exists unless told otherwise. */
export class FakeCnpjLookup implements CnpjLookup {
  public unknown = new Set<string>();
  public failing = false;

  async find(cnpj: string): Promise<CnpjRecord | null> {
    if (this.failing) throw new Error("BrasilAPI is down");
    if (this.unknown.has(cnpj)) return null;

    return {
      legalName: "ASSOCIACAO PROTETORA DOS ANIMAIS",
      tradeName: null,
      registrationStatus: "ATIVA",
      legalNatureCode: 3999,
      legalNature: "Associação Privada",
      city: "SAO PAULO",
      state: "SP",
      mainActivity: "Atividades de associações de defesa de direitos sociais",
      openedAt: "2015-03-10",
    };
  }
}
