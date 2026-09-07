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
    age: z.coerce.number().optional(),
    size: z.enum(AnimalSize).optional(),
    type: z.enum(AnimalType).optional(),
  });

  const { city, page, age, size, type } = fetchPetByCityQuerySchema.parse(
    request.query,
  );

  const fetchPetByCityUseCase = makeFetchPetByCityUseCase();
  const pets = await fetchPetByCityUseCase.execute({
    city,
    page,
    age,
    size,
    type,
  });

  return reply.status(200).send(pets);
}
