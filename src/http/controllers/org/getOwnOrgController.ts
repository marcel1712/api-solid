import { FastifyReply, FastifyRequest } from "fastify";
import { makeGetOwnOrgUseCase } from "@/use-cases/factories/make-get-own-org-use-case";
import { toOwnOrg } from "@/http/utils/org-views";
import { isAdminEmail } from "@/http/middlewares/verify-admin";

export async function getOwnOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getOwnOrgUseCase = makeGetOwnOrgUseCase();
  const { org, documents } = await getOwnOrgUseCase.execute(
    request.orgId as string,
  );

  return reply.status(200).send({
    ...toOwnOrg(org),
    // Which documents are in, not where: the files are only for the reviewer.
    documents: documents.map((document) => ({
      kind: document.kind,
      uploadedAt: document.created_at,
    })),
    isAdmin: org.emailVerifiedAt !== null && isAdminEmail(org.email),
  });
}
