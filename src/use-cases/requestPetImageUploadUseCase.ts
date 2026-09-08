import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PetImage } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";
import { PetImageRepository } from "@/repositories/pet-image-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { LimitExceededError } from "@/use-cases/errors/limit-exceeded-error";
import { r2 } from "@/lib/r2";
import env from "@/env/env";

const MAX_IMAGES_PER_PET = 3;
const UPLOAD_URL_EXPIRES_IN_SECONDS = 5 * 60;

interface RequestPetImageUploadRequest {
  petId: string;
  orgId: string;
  contentType: string;
}

interface RequestPetImageUploadResponse {
  image: PetImage;
  uploadUrl: string;
}

export class RequestPetImageUploadUseCase {
  constructor(
    private petRepository: PetRepository,
    private petImageRepository: PetImageRepository,
  ) {}

  async execute(
    request: RequestPetImageUploadRequest,
  ): Promise<RequestPetImageUploadResponse> {
    const pet = await this.petRepository.findById(request.petId);

    if (!pet) {
      throw new ResourceNotFoundError();
    }

    if (pet.orgId !== request.orgId) {
      throw new NotAllowedError();
    }

    const imageCount = await this.petImageRepository.countByPetId(
      request.petId,
    );

    if (imageCount >= MAX_IMAGES_PER_PET) {
      throw new LimitExceededError(
        `A pet can have at most ${MAX_IMAGES_PER_PET} images`,
      );
    }

    const extension = request.contentType.split("/")[1];
    const key = `pets/${request.petId}/${randomUUID()}.${extension}`;
    const url = `${env.R2_PUBLIC_URL}/${key}`;

    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        ContentType: request.contentType,
      }),
      { expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS },
    );

    const image = await this.petImageRepository.create({
      petId: request.petId,
      key,
      url,
    });

    return { image, uploadUrl };
  }
}
