import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { OrgDocumentKind } from "@prisma/client";
import { makeConfirmOrgDocumentUploadUseCase } from "@/use-cases/factories/make-confirm-org-document-upload-use-case";

export async function confirmOrgDocumentUploadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const bodySchema = z.object({
    kind: z.enum(OrgDocumentKind),
    key: z.string().min(1),
  });

  const { kind, key } = bodySchema.parse(request.body);

  const useCase = makeConfirmOrgDocumentUploadUseCase();
  const { status, documents } = await useCase.execute({
    orgId: request.orgId as string,
    kind,
    key,
  });

  return reply.status(200).send({
    status,
    documents: documents.map((document) => ({
      kind: document.kind,
      uploadedAt: document.created_at,
    })),
  });
}
