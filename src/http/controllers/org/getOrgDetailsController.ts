import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeGetOrgDetailsUseCase } from "@/use-cases/factories/make-get-org-use-case";

export async function getOrgDetailsController(request: FastifyRequest, reply: FastifyReply){

    const getOrgParamsScheme = z.object({
        id: z.uuid(),
    });

    const { id } = getOrgParamsScheme.parse(request.params);

    const getOrgDetailsUseCase = makeGetOrgDetailsUseCase();
    const { password_hash: _password_hash, ...org } = await getOrgDetailsUseCase.execute({ orgId: id });

    return reply.status(200).send(org);
}
