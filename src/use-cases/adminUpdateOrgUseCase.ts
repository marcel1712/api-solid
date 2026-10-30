import { Org } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { SendEmailVerificationUseCase } from "@/use-cases/sendEmailVerificationUseCase";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface AdminUpdateOrgRequest {
  orgId: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
}

export class AdminUpdateOrgUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private sendEmailVerificationUseCase: SendEmailVerificationUseCase,
  ) {}

  async execute(request: AdminUpdateOrgRequest): Promise<Org> {
    const org = await this.orgRepository.findById(request.orgId);
    if (!org) {
      throw new ResourceNotFoundError();
    }

    // A typo the org can't fix itself (the field isn't open to self-service
    // edits, precisely because it's also the login/verification identity):
    // changing it here means the new address hasn't been proven yet either.
    const emailChanged = request.email !== undefined && request.email !== org.email;

    const updatedOrg = await this.orgRepository.update(request.orgId, {
      name: request.name,
      email: request.email,
      whatsapp: request.whatsapp,
      city: request.city,
      address: request.address,
      emailVerifiedAt: emailChanged ? null : undefined,
    });

    if (emailChanged && updatedOrg) {
      await this.sendEmailVerificationUseCase.execute({
        orgId: updatedOrg.id,
        email: updatedOrg.email,
      });
    }

    return updatedOrg as Org;
  }
}
