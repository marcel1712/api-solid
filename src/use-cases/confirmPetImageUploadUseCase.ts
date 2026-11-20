import {
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  NotFound,
} from "@aws-sdk/client-s3";
import { PetImage } from "@prisma/client";
import { PetRepository } from "@/repositories/pet-repository";
import { PetImageRepository } from "@/repositories/pet-image-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { LimitExceededError } from "@/use-cases/errors/limit-exceeded-error";
import { r2 } from "@/lib/r2";
import env from "@/env/env";
import {
  MAX_PET_IMAGE_SIZE_BYTES,
  PET_IMAGE_CONTENT_TYPES,
} from "@/use-cases/requestPetImageUploadUseCase";

const MAX_IMAGES_PER_PET = 3;

interface ConfirmPetImageUploadRequest {
  petId: string;
  orgId: string;
  key: string;
}

export class ConfirmPetImageUploadUseCase {
  constructor(
    private petRepository: PetRepository,
    private petImageRepository: PetImageRepository,
  ) {}

  async execute(request: ConfirmPetImageUploadRequest): Promise<PetImage> {
    const pet = await this.petRepository.findById(request.petId);

    if (!pet) {
      throw new ResourceNotFoundError();
    }

    if (pet.orgId !== request.orgId) {
      throw new NotAllowedError();
    }

    if (!request.key.startsWith(`pets/${request.petId}/`)) {
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

    let head: HeadObjectCommandOutput;
    try {
      head = await r2.send(
        new HeadObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: request.key,
        }),
      );
    } catch (error) {
      if (error instanceof NotFound) {
        throw new ResourceNotFoundError();
      }
      throw error;
    }

    // The signed URL already pins type and size; this is the second lock, for
    // anything that got in another way. It's public, so it goes right away.
    const allowedType = (PET_IMAGE_CONTENT_TYPES as readonly string[]).includes(
      head.ContentType ?? "",
    );
    const size = head.ContentLength ?? 0;
    if (!allowedType || size === 0 || size > MAX_PET_IMAGE_SIZE_BYTES) {
      await r2.send(
        new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: request.key }),
      );
      throw new NotAllowedError();
    }

    const url = `${env.R2_PUBLIC_URL}/${request.key}`;

    return this.petImageRepository.create({
      petId: request.petId,
      key: request.key,
      url,
    });
  }
}
