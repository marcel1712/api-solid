import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { makeGetOrgDetailsUseCase } from "@/use-cases/factories/make-get-org-use-case";

export async function getOrgDetailsController(request: FastifyRequest, reply: FastifyReply){

    const getOrgParamsScheme = z.object({
        id: z.uuid(),
    });

    try {
        const { id } = getOrgParamsScheme.parse(request.params);

        const getOrgDetailsUseCase = makeGetOrgDetailsUseCase();
        const { password_hash: _password_hash, ...org } = await getOrgDetailsUseCase.execute({ orgId: id });

        return reply.status(200).send(org);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return reply.status(400).send({
                message: "Invalid organization id",
                issues: err.issues,
            });
        }

        return reply
            .status(404)
            .send({ message: "No organization found with the given id" });
    }
}
