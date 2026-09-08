import { makeUpdatePetUseCase } from "@/use-cases/factories/make-update-pet-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function updatePetController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const updatePetParamsScheme = z.object({
    id: z.uuid(),
  });

  const updatePetBodyScheme = z.object({
    name: z.string().min(1).optional(),
    age: z.int().optional(),
    size: z.literal(["Small", "Medium", "Large"]).optional(),
    type: z.literal([
      "Dog",
      "Cat",
      "Bird",
      "Fish",
      "Turtle",
      "Rabbit",
      "Hamster",
      "Ferret",
      "Chinchilla",
    ]).optional(),
    bio: z.string().optional(),
  });

  const { id } = updatePetParamsScheme.parse(request.params);
  const { name, age, size, type, bio } = updatePetBodyScheme.parse(
    request.body,
  );

  const orgId = request.orgId as string;

  const updatePetUseCase = makeUpdatePetUseCase();
  const pet = await updatePetUseCase.execute({
    petId: id,
    orgId,
    name,
    age,
    size,
    type,
    bio,
  });

  return reply.status(200).send(pet);
}
