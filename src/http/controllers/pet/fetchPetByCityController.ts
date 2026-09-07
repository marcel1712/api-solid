import { makeFetchPetByCityUseCase } from "@/use-cases/factories/make-fetch-pet-by-city-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AnimalSize, AnimalType } from "@prisma/client";

export async function fetchPetByCityController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const fetchPetByCityQuerySchema = z.object({
    city: z.string().trim().min(1),
    page: z.coerce.number().min(1),
    ageMin: z.coerce.number().min(0).optional(),
    ageMax: z.coerce.number().min(0).optional(),
    size: z.enum(AnimalSize).optional(),
    type: z.enum(AnimalType).optional(),
  });

  const { city, page, ageMin, ageMax, size, type } =
    fetchPetByCityQuerySchema.parse(request.query);

  const fetchPetByCityUseCase = makeFetchPetByCityUseCase();
  const pets = await fetchPetByCityUseCase.execute({
    city,
    page,
    ageMin,
    ageMax,
    size,
    type,
  });

  return reply.status(200).send(pets);
}
