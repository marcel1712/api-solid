import { Org } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";

interface UpdateOrgRequest {
  orgId: string;
  requesterOrgId: string;
  name?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
}

export class UpdateOrgUseCase {
  constructor(private orgRepository: OrgRepository) {}

  async execute(request: UpdateOrgRequest): Promise<Org> {
    const org = await this.orgRepository.findById(request.orgId);

    if (!org) {
      throw new ResourceNotFoundError();
    }

    if (org.id !== request.requesterOrgId) {
      throw new NotAllowedError();
    }

    const updatedOrg = await this.orgRepository.update(request.orgId, {
      name: request.name,
      whatsapp: request.whatsapp,
      city: request.city,
      address: request.address,
    });

    return updatedOrg as Org;
  }
}
