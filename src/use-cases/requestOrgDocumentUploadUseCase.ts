import { randomUUID } from "node:crypto";
import { OrgDocumentKind, OrgStatus } from "@prisma/client";
import { OrgRepository } from "@/repositories/org-repository";
import { DocumentStorage } from "@/lib/document-storage";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";

export const DOCUMENT_CONTENT_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type DocumentContentType = keyof typeof DOCUMENT_CONTENT_TYPES;

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

/** Documents can only change while nobody is looking at them. */
export const DOCUMENT_EDITABLE_STATUSES: OrgStatus[] = [
  OrgStatus.Pending,
  OrgStatus.Rejected,
];

interface RequestOrgDocumentUploadRequest {
  orgId: string;
  kind: OrgDocumentKind;
  contentType: DocumentContentType;
  size: number;
}

interface RequestOrgDocumentUploadResponse {
  key: string;
  uploadUrl: string;
}

export class RequestOrgDocumentUploadUseCase {
  constructor(
    private orgRepository: OrgRepository,
    private documentStorage: DocumentStorage,
  ) {}

  async execute(
    request: RequestOrgDocumentUploadRequest,
  ): Promise<RequestOrgDocumentUploadResponse> {
    const org = await this.orgRepository.findById(request.orgId);
    if (!org) {
      throw new ResourceNotFoundError();
    }

    if (!DOCUMENT_EDITABLE_STATUSES.includes(org.status)) {
      throw new NotAllowedError();
    }

    const extension = DOCUMENT_CONTENT_TYPES[request.contentType];
    const key = `orgs/${org.id}/${request.kind}-${randomUUID()}.${extension}`;

    const uploadUrl = await this.documentStorage.createUploadUrl(
      key,
      request.contentType,
      request.size,
    );

    return { key, uploadUrl };
  }
}
