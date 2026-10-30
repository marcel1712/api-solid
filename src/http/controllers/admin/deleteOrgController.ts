import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeDeleteOrgUseCase } from "@/use-cases/factories/make-delete-org-use-case";

export async function deleteOrgController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const paramsSchema = z.object({ id: z.uuid() });
  // Reason is always required for the audit trail, whether or not it ends
  // up on a block-list entry. `block` defaults to true (bad-faith signup);
  // an admin removing an org at its own request sets it to false.
  const bodySchema = z.object({
    reason: z.string().trim().min(10).max(1000),
    block: z.boolean().default(true),
  });

  const { id } = paramsSchema.parse(request.params);
  const { reason, block } = bodySchema.parse(request.body);

  const useCase = makeDeleteOrgUseCase();
  await useCase.execute({ orgId: id, reason, block });

  return reply.status(204).send();
}
