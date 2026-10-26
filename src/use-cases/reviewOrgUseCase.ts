import { Org, OrgStatus } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { OrgDocumentRepository } from "@/repositories/org-document-repository";
import { DocumentStorage } from "@/lib/document-storage";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";

type ReviewOrgRequest =
  | { orgId: string; decision: "approve" }
  | { orgId: string; decision: "reject"; reason: string };

export class ReviewOrgUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private orgDocumentRepository: OrgDocumentRepository,
    private documentStorage: DocumentStorage,
  ) {}

  async execute(request: ReviewOrgRequest): Promise<Org> {
    const org = await this.orgRepository.findById(request.orgId);
    if (!org) {
      throw new ResourceNotFoundError();
    }

    // A decision is taken on what the org sent; one still filling in its
    // documents, or already decided, has nothing to decide on.
    if (org.status !== OrgStatus.UnderReview) {
      throw new NotAllowedError();
    }

    // The paperwork only existed to support this decision. Once it's taken,
    // the files go — what stays is who was decided, when and why.
    const documents = await this.orgDocumentRepository.findManyByOrgId(org.id);
    for (const document of documents) {
      await this.documentStorage.delete(document.key);
    }
    await this.orgDocumentRepository.deleteManyByOrgId(org.id);

    const review =
      request.decision === "approve"
        ? {
            status: OrgStatus.Approved,
            rejectionReason: null,
            reviewedAt: new Date(),
          }
        : {
            status: OrgStatus.Rejected,
            rejectionReason: request.reason,
            reviewedAt: new Date(),
          };

    await this.orgRepository.saveReview(org.id, review);

    return { ...org, ...review };
  }
}
