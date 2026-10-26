import { Org, OrgDocumentKind, OrgStatus } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { OrgDocumentRepository } from "@/repositories/org-document-repository";
import { DocumentStorage } from "@/lib/document-storage";

export interface OrgForReview {
  org: Org;
  documents: { kind: OrgDocumentKind; url: string; uploadedAt: Date }[];
}

export class ListOrgsForReviewUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private orgDocumentRepository: OrgDocumentRepository,
    private documentStorage: DocumentStorage,
  ) {}

  async execute(status: OrgStatus): Promise<OrgForReview[]> {
    const orgs = await this.orgRepository.findManyByStatus(status);

    return Promise.all(
      orgs.map(async (org) => {
        const documents = await this.orgDocumentRepository.findManyByOrgId(
          org.id,
        );

        return {
          org,
          // Links expire in minutes: a reviewer's tab left open doesn't keep
          // the files reachable.
          documents: await Promise.all(
            documents.map(async (document) => ({
              kind: document.kind,
              url: await this.documentStorage.createDownloadUrl(document.key),
              uploadedAt: document.created_at,
            })),
          ),
        };
      }),
    );
  }
}
