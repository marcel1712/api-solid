import { makeDeletePetImageUseCase } from "@/use-cases/factories/make-delete-pet-image-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function deletePetImageController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const deletePetImageParamsScheme = z.object({
    id: z.uuid(),
    imageId: z.uuid(),
  });

  const { id: petId, imageId } = deletePetImageParamsScheme.parse(
    request.params,
  );

  const orgId = request.orgId as string;

  const deletePetImageUseCase = makeDeletePetImageUseCase();
  await deletePetImageUseCase.execute({ petId, imageId, orgId });

  return reply.status(204).send();
}
