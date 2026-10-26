import { OrgRepository } from "@/repositories/org-repository";
import { CnpjLookup } from "@/lib/cnpj-lookup";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { buildCnpjCheck, CnpjCheck } from "@/utils/cnpj-check";

export class RecheckOrgCnpjUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private cnpjLookup: CnpjLookup,
  ) {}

  async execute(orgId: string): Promise<CnpjCheck> {
    const org = await this.orgRepository.findById(orgId);
    if (!org || !org.cnpj) {
      throw new ResourceNotFoundError();
    }

    // Unlike at signup, a failed lookup here is an error the reviewer sees:
    // they asked for the check and should know it didn't happen.
    const record = await this.cnpjLookup.find(org.cnpj);
    const check = buildCnpjCheck(record, org.city);
    await this.orgRepository.saveCnpjCheck(org.id, check);

    return check;
  }
}
