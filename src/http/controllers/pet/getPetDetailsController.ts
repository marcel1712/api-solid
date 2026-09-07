import { makeGetPetUseCase } from "@/use-cases/factories/make-get-pet-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AnimalSize, AnimalType } from "@prisma/client";

interface GetPetDetailsResponse {
    id: string,
    type: AnimalType,
    name: string,
    created_at: Date,
    orgId: string,
    age: number,
    size: AnimalSize,
    bio: string | null,
    adopted: boolean,
    whatsapp: string
}

export async function getPetDetailsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
    const getPetParamsScheme = z.object({
        id: z.uuid()
    })

    const { id } = getPetParamsScheme.parse(request.params);

    const getPetUseCase = makeGetPetUseCase();
    const { pet, whatsapp } = await getPetUseCase.execute({
        petId: id
    })

    const petDetails: GetPetDetailsResponse = { ...pet, whatsapp };

    return reply.status(200).send(petDetails);
}
