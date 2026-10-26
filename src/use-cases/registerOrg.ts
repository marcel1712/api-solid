import { OrgRepository } from "@/repositories/org-repository";
import { Org, Prisma } from "@prisma/client";
import { hash } from "bcrypt";
import { ResourceAlreadyExistsError } from "@/use-cases/errors/resource-already-exists-error";
import { CnpjNotFoundError } from "@/use-cases/errors/cnpj-not-found-error";
import { CnpjLookup, CnpjRecord } from "@/lib/cnpj-lookup";
import { buildCnpjCheck } from "@/utils/cnpj-check";

interface RegisterOrgRequest {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  city: string;
  address: string;
  /** Digits only, already checksum-validated by the controller. */
  cnpj: string;
}

interface CreatedOrgResponse {
  org: Org;
}

export class RegisterOrgUseCase {
  constructor(
    private OrgRepository: OrgRepository,
    private cnpjLookup: CnpjLookup,
  ) {}

  async execute(request: RegisterOrgRequest): Promise<CreatedOrgResponse> {
    const emailExist = await this.OrgRepository.findByEmail(request.email);
    if (emailExist) {
      throw new ResourceAlreadyExistsError("This email is already registered");
    }

    const cnpjExist = await this.OrgRepository.findByCnpj(request.cnpj);
    if (cnpjExist) {
      throw new ResourceAlreadyExistsError("This CNPJ is already registered");
    }

    // A CNPJ the Receita doesn't know is a typo or made up — refused here.
    // A lookup that fails (BrasilAPI down, timeout) is not the org's fault:
    // signup goes on and the reviewer re-runs the check later.
    let record: CnpjRecord | null | undefined;
    try {
      record = await this.cnpjLookup.find(request.cnpj);
    } catch {
      record = undefined;
    }

    if (record === null) {
      throw new CnpjNotFoundError();
    }

    const password_hash: string = await hash(request.password, 10);

    const org: Org = await this.OrgRepository.create({
      name: request.name,
      email: request.email,
      password_hash: password_hash,
      whatsapp: request.whatsapp,
      city: request.city,
      address: request.address,
      cnpj: request.cnpj,
      cnpjCheck: record
        ? (buildCnpjCheck(record, request.city) as unknown as Prisma.InputJsonValue)
        : undefined,
    });

    return {
      org,
    };
  }
}
