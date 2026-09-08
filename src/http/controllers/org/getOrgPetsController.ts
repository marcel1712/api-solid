import { makeGetOrgPetsUseCase } from "@/use-cases/factories/make-get-org-pets-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function getOrgPetsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getOrgPetsQueryScheme = z.object({
    page: z.coerce.number().min(1),
  });

  const { page } = getOrgPetsQueryScheme.parse(request.query);

  const orgId = request.orgId as string;

  const getOrgPetsUseCase = makeGetOrgPetsUseCase();
  const pets = await getOrgPetsUseCase.execute({ orgId, page });

  return reply.status(200).send(pets);
}
