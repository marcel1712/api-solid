import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeRecheckOrgCnpjUseCase } from "@/use-cases/factories/make-recheck-org-cnpj-use-case";

export async function recheckOrgCnpjController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = z.object({ id: z.uuid() }).parse(request.params);

  const useCase = makeRecheckOrgCnpjUseCase();
  const check = await useCase.execute(id);

  return reply.status(200).send(check);
}
