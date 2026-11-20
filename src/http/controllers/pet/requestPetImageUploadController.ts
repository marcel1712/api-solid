import { makeRequestPetImageUploadUseCase } from "@/use-cases/factories/make-request-pet-image-upload-use-case";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  MAX_PET_IMAGE_SIZE_BYTES,
  PET_IMAGE_CONTENT_TYPES,
} from "@/use-cases/requestPetImageUploadUseCase";

export async function requestPetImageUploadController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const requestPetImageUploadParamsScheme = z.object({
    id: z.uuid(),
  });

  const requestPetImageUploadBodyScheme = z.object({
    contentType: z.enum(PET_IMAGE_CONTENT_TYPES),
    size: z.number().int().positive().max(MAX_PET_IMAGE_SIZE_BYTES),
  });

  const { id: petId } = requestPetImageUploadParamsScheme.parse(
    request.params,
  );
  const { contentType, size } = requestPetImageUploadBodyScheme.parse(request.body);

  const orgId = request.orgId as string;

  const requestPetImageUploadUseCase = makeRequestPetImageUploadUseCase();
  const { key, url, uploadUrl } = await requestPetImageUploadUseCase.execute({
    petId,
    orgId,
    contentType,
    size,
  });

  return reply.status(201).send({ key, url, uploadUrl });
}
