import { makeRegisterPetUseCase } from "@/use-cases/factories/make-register-pet-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function registerPetController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const createPetBodyScheme = z.object({
    name: z.string(),
    orgId: z.string(),
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
      "Furret",
      "Chinchilla",
    ]),
    bio: z.string().optional(),
  });

  try{
    const { name, orgId, age, size, type, bio } = createPetBodyScheme.parse(
      request.body,
    );

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return reply.status(409).send({ error: "Unable to register with the provided information" });
  }
}
