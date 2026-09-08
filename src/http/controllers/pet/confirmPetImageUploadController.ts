import { makeConfirmPetImageUploadUseCase } from "@/use-cases/factories/make-confirm-pet-image-upload-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function confirmPetImageUploadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const confirmPetImageUploadParamsScheme = z.object({
    id: z.uuid(),
  });

  const confirmPetImageUploadBodyScheme = z.object({
    key: z.string().min(1),
  });

  const { id: petId } = confirmPetImageUploadParamsScheme.parse(
    request.params,
  );
  const { key } = confirmPetImageUploadBodyScheme.parse(request.body);

  const orgId = request.orgId as string;

  const confirmPetImageUploadUseCase = makeConfirmPetImageUploadUseCase();
  const image = await confirmPetImageUploadUseCase.execute({
    petId,
    orgId,
    key,
  });

  return reply.status(201).send(image);
}
