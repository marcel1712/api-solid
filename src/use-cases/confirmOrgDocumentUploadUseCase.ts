import { OrgDocument, OrgDocumentKind, OrgStatus } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { OrgDocumentRepository } from "@/repositories/org-document-repository";
import { DocumentStorage } from "@/lib/document-storage";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import {
  DOCUMENT_EDITABLE_STATUSES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/use-cases/requestOrgDocumentUploadUseCase";

export const REQUIRED_DOCUMENT_KINDS: OrgDocumentKind[] = [
  OrgDocumentKind.Statute,
  OrgDocumentKind.BoardMinutes,
];

interface ConfirmOrgDocumentUploadRequest {
  orgId: string;
  kind: OrgDocumentKind;
  key: string;
}

interface ConfirmOrgDocumentUploadResponse {
  status: OrgStatus;
  documents: OrgDocument[];
}

export class ConfirmOrgDocumentUploadUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private orgDocumentRepository: OrgDocumentRepository,
    private documentStorage: DocumentStorage,
  ) {}

  async execute(
    request: ConfirmOrgDocumentUploadRequest,
  ): Promise<ConfirmOrgDocumentUploadResponse> {
    const org = await this.orgRepository.findById(request.orgId);
    if (!org) {
      throw new ResourceNotFoundError();
    }

    if (!DOCUMENT_EDITABLE_STATUSES.includes(org.status)) {
      throw new NotAllowedError();
    }

    // The key came back from the client: it must be one this org was handed,
    // for this kind of document.
    if (!request.key.startsWith(`orgs/${org.id}/${request.kind}-`)) {
      throw new NotAllowedError();
    }

    const size = await this.documentStorage.sizeOf(request.key);
    if (size === null) {
      throw new ResourceNotFoundError();
    }
    if (size > MAX_DOCUMENT_SIZE_BYTES) {
      await this.documentStorage.delete(request.key);
      throw new NotAllowedError();
    }

    // The key, not the record: saving may update that same record in place.
    const previousKey = (
      await this.orgDocumentRepository.findManyByOrgId(org.id)
    ).find((document) => document.kind === request.kind)?.key;

    await this.orgDocumentRepository.save({
      orgId: org.id,
      kind: request.kind,
      key: request.key,
    });

    if (previousKey && previousKey !== request.key) {
      await this.documentStorage.delete(previousKey);
    }

    const documents = await this.orgDocumentRepository.findManyByOrgId(org.id);
    const complete = REQUIRED_DOCUMENT_KINDS.every((kind) =>
      documents.some((document) => document.kind === kind),
    );

    // Both files in: the org goes to the review queue on its own, no extra
    // "submit" step to forget.
    const status = complete ? OrgStatus.UnderReview : org.status;
    if (status !== org.status) {
      await this.orgRepository.updateStatus(org.id, status);
    }

    return { status, documents };
  }
}
