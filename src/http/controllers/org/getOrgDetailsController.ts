import { setPublicCache } from "@/http/utils/public-cache";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeGetOrgDetailsUseCase } from "@/use-cases/factories/make-get-org-use-case";
import { toPublicOrg } from "@/http/utils/org-views";

export async function getOrgDetailsController(request: FastifyRequest, reply: FastifyReply){

    const getOrgParamsScheme = z.object({
        id: z.uuid(),
    });

    const { id } = getOrgParamsScheme.parse(request.params);

    const getOrgDetailsUseCase = makeGetOrgDetailsUseCase();
    const org = await getOrgDetailsUseCase.execute({ orgId: id });

    setPublicCache(request, reply);

    return reply.status(200).send(toPublicOrg(org));
}
