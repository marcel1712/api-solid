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

    try{
        const { id: petId } = markPetAsAdoptedParamsScheme.parse(request.params)
        const { adopted } = markPetAsAdoptedScheme.parse(request.body)

        const markPetAsAdoptedUseCase = await makeMarkPetAsAdoptedUseCase()

        const adoptedPet = await markPetAsAdoptedUseCase.execute({
            petId,
            adopted
        })

        return reply.status(200).send({ adoptedPet })
    }catch(err){
        if (err instanceof z.ZodError) {
            return reply.status(400).send({
                message: "Invalid request",
                issues: err.issues,
            })
        }
        if (err instanceof Error) {
            return reply.status(404).send({ message: err.message })
        }
        throw err
    }
}