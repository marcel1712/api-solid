import { reportError } from "@/lib/monitoring";

export interface CnpjRecord {
  legalName: string;
  tradeName: string | null;
  /** As the Receita Federal writes it: "ATIVA", "BAIXADA", "INAPTA"... */
  registrationStatus: string;
  legalNatureCode: number;
  legalNature: string;
  city: string;
  state: string;
  mainActivity: string;
  openedAt: string | null;
}

export interface CnpjLookup {
  /**
   * `null` when the CNPJ doesn't exist. Throws when the lookup itself fails
   * (timeout, service down), so callers can tell "not found" from "unknown".
   */
  find(cnpj: string): Promise<CnpjRecord | null>;
}

const TIMEOUT_MS = 8000;

interface BrasilApiCnpj {
  razao_social: string;
  nome_fantasia: string | null;
  descricao_situacao_cadastral: string;
  codigo_natureza_juridica: number;
  natureza_juridica: string;
  municipio: string;
  uf: string;
  cnae_fiscal_descricao: string;
  data_inicio_atividade: string | null;
}

export class BrasilApiCnpjLookup implements CnpjLookup {
  async find(cnpj: string): Promise<CnpjRecord | null> {
    try {
      return await this.request(cnpj);
    } catch (error) {
      // Callers may carry on without the check (signup does), so this is the
      // one place the reason is sure to be recorded.
      console.error("BrasilAPI CNPJ lookup failed:", error);
      // Signup goes on without the check, so this is the only way to learn
      // that every lookup is failing (as when BrasilAPI started blocking us).
      reportError(error, { service: "BrasilAPI" });
      throw error;
    }
  }

  private async request(cnpj: string): Promise<CnpjRecord | null> {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        // BrasilAPI sits behind Cloudflare, which answers 403 to Node's
        // default `User-Agent: node`. Identifying the caller gets through.
        headers: { "User-Agent": "Tailhop/1.0 (+https://tailhop.com.br)" },
      },
    );

    // BrasilAPI answers 404 for an unknown CNPJ and 400 for a malformed one.
    if (response.status === 404 || response.status === 400) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`BrasilAPI CNPJ lookup failed with ${response.status}`);
    }

    const data = (await response.json()) as BrasilApiCnpj;

    return {
      legalName: data.razao_social,
      tradeName: data.nome_fantasia || null,
      registrationStatus: data.descricao_situacao_cadastral,
      legalNatureCode: data.codigo_natureza_juridica,
      legalNature: data.natureza_juridica,
      city: data.municipio,
      state: data.uf,
      mainActivity: data.cnae_fiscal_descricao,
      openedAt: data.data_inicio_atividade,
    };
  }
}
