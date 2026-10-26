import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { OrgDocumentKind } from "@prisma/client";
import { makeRequestOrgDocumentUploadUseCase } from "@/use-cases/factories/make-request-org-document-upload-use-case";
import {
  DOCUMENT_CONTENT_TYPES,
  DocumentContentType,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/use-cases/requestOrgDocumentUploadUseCase";

export async function requestOrgDocumentUploadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    kind: z.enum(OrgDocumentKind),
    contentType: z.enum(
      Object.keys(DOCUMENT_CONTENT_TYPES) as [DocumentContentType],
    ),
    size: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
  });

  const { kind, contentType, size } = bodySchema.parse(request.body);

  const useCase = makeRequestOrgDocumentUploadUseCase();
  const ticket = await useCase.execute({
    orgId: request.orgId as string,
    kind,
    contentType,
    size,
  });

  return reply.status(201).send(ticket);
}
