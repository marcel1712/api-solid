import { makeMarkPetAsAdoptedUseCase } from "@/use-cases/factories/make-mark-pet-as-adopted";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function markPetAsAdoptedController(request:FastifyRequest, reply:FastifyReply) {

    const markPetAsAdoptedScheme = z.object({
        adopted: z.boolean()
    })

    const markPetAsAdoptedParamsScheme = z.object({
        id: z.string().uuid(),
    });

    const { id: petId } = markPetAsAdoptedParamsScheme.parse(request.params)
    const { adopted } = markPetAsAdoptedScheme.parse(request.body)

    const markPetAsAdoptedUseCase = await makeMarkPetAsAdoptedUseCase()

    const orgId = request.orgId as string

    const adoptedPet = await markPetAsAdoptedUseCase.execute({
        petId,
        orgId,
        adopted
    })

    return reply.status(200).send({ adoptedPet })
}
