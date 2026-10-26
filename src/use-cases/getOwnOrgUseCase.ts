import { Org, OrgDocument } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { OrgDocumentRepository } from "@/repositories/org-document-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetOwnOrgResponse {
  org: Org;
  documents: OrgDocument[];
}

export class GetOwnOrgUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private orgDocumentRepository: OrgDocumentRepository,
  ) {}

  async execute(orgId: string): Promise<GetOwnOrgResponse> {
    const org = await this.orgRepository.findById(orgId);
    if (!org) {
      throw new ResourceNotFoundError();
    }

    const documents = await this.orgDocumentRepository.findManyByOrgId(orgId);

    return { org, documents };
  }
}
