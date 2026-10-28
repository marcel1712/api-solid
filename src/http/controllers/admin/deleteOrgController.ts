import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeDeleteOrgUseCase } from "@/use-cases/factories/make-delete-org-use-case";

export async function deleteOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.uuid() });
  // Required: this both audits the decision and becomes the reason stored
  // on the block-list entries that stop the same contact from signing up
  // again.
  const bodySchema = z.object({
    reason: z.string().trim().min(10).max(1000),
  });

  const { id } = paramsSchema.parse(request.params);
  const { reason } = bodySchema.parse(request.body);

  const useCase = makeDeleteOrgUseCase();
  await useCase.execute({ orgId: id, reason });

  return reply.status(204).send();
}
