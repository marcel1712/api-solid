import { makeGetPetUseCase } from "@/use-cases/factories/make-get-pet-use-case";
import { Pet } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function getPetDetailsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
    const getPetBodyScheme = z.object({
        id: z.string()
    })

    const { id } = getPetBodyScheme.parse(request.params);

    try{

        const getPetUseCase = makeGetPetUseCase();
        const pet: Pet = await getPetUseCase.execute({
            petId: id,
        })

        return reply.status(200).send(pet)

    } catch {
        return reply.status(404).send({ message: "Pet not found" });
    }
}