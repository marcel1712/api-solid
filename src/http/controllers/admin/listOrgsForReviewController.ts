import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { OrgStatus } from "@prisma/client";
import { makeListOrgsForReviewUseCase } from "@/use-cases/factories/make-list-orgs-for-review-use-case";

export async function listOrgsForReviewController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const querySchema = z.object({
    status: z.enum(OrgStatus).default(OrgStatus.UnderReview),
  });

  const { status } = querySchema.parse(request.query);

  const useCase = makeListOrgsForReviewUseCase();
  const orgs = await useCase.execute(status);

  return reply.status(200).send(
    orgs.map(({ org, documents }) => {
      const { password_hash: _password_hash, ...reviewable } = org;
      return { ...reviewable, documents };
    }),
  );
}
