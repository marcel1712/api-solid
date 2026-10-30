import { OrgRepository } from "@/repositories/org-repository";
import { BlockedContactRepository } from "@/repositories/blocked-contact-repository";
import { Org, Prisma } from "@prisma/client";
import { hash } from "bcrypt";
import { ResourceAlreadyExistsError } from "@/use-cases/errors/resource-already-exists-error";
import { CnpjNotFoundError } from "@/use-cases/errors/cnpj-not-found-error";
import { CnpjNotEligibleError } from "@/use-cases/errors/cnpj-not-eligible-error";
import { RegistrationBlockedError } from "@/use-cases/errors/registration-blocked-error";
import { CnpjLookup, CnpjRecord } from "@/lib/cnpj-lookup";
import { buildCnpjCheck, isNonProfitLegalNature } from "@/utils/cnpj-check";

interface RegisterOrgRequest {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  city: string;
  address: string;
  /** Digits only, already checksum-validated by the controller. */
  cnpj: string;
  /** The terms version the org accepted; the controller only lets the current one in. */
  termsVersion: string;
}

interface CreatedOrgResponse {
  org: Org;
}

export class RegisterOrgUseCase {
  constructor(
    private OrgRepository: OrgRepository,
    private cnpjLookup: CnpjLookup,
    private blockedContactRepository: BlockedContactRepository,
  ) {}

  async execute(request: RegisterOrgRequest): Promise<CreatedOrgResponse> {
    const blocked = await this.blockedContactRepository.existsEmailOrWhatsapp(
      request.email,
      request.whatsapp,
    );
    if (blocked) {
      throw new RegistrationBlockedError();
    }

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

    // The Receita doesn't know what an org does, but it does know whether
    // it's a for-profit company — a software or hosting business can have a
    // perfectly real, active CNPJ and still not be an eligible org.
    if (record && !isNonProfitLegalNature(record.legalNatureCode)) {
      throw new CnpjNotEligibleError();
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
      termsVersion: request.termsVersion,
      termsAcceptedAt: new Date(),
      cnpjCheck: record
        ? (buildCnpjCheck(record, request.city) as unknown as Prisma.InputJsonValue)
        : undefined,
    });

    return {
      org,
    };
  }
}
