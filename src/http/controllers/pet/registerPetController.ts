import { makeRegisterPetUseCase } from "@/use-cases/factories/make-register-pet-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function registerPetController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createPetBodyScheme = z.object({
    name: z.string(),
    age: z.int(),
    size: z.literal(["Small", "Medium", "Large"]),
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
    ]),
    bio: z.string().optional(),
  });

  const { name, age, size, type, bio } = createPetBodyScheme.parse(
    request.body,
  );

  const orgId = request.orgId as string;

  const registerPetUseCase = makeRegisterPetUseCase();
  const { pet } = await registerPetUseCase.execute({
    name,
    orgId,
    age,
    size,
    type,
    bio,
  });

  return reply.status(201).send(pet);
}
