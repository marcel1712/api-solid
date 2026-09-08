import { makeRequestPetImageUploadUseCase } from "@/use-cases/factories/make-request-pet-image-upload-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export async function requestPetImageUploadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestPetImageUploadParamsScheme = z.object({
    id: z.uuid(),
  });

  const requestPetImageUploadBodyScheme = z.object({
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  });

  const { id: petId } = requestPetImageUploadParamsScheme.parse(
    request.params,
  );
  const { contentType } = requestPetImageUploadBodyScheme.parse(request.body);

  const orgId = request.orgId as string;

  const requestPetImageUploadUseCase = makeRequestPetImageUploadUseCase();
  const { key, url, uploadUrl } = await requestPetImageUploadUseCase.execute({
    petId,
    orgId,
    contentType,
  });

  return reply.status(201).send({ key, url, uploadUrl });
}
