import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { PetRepository } from "@/repositories/pet-repository";
import { PetImageRepository } from "@/repositories/pet-image-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { r2 } from "@/lib/r2";
import env from "@/env/env";

interface DeletePetImageRequest {
  petId: string;
  imageId: string;
  orgId: string;
}

export class DeletePetImageUseCase {
  constructor(
    private petRepository: PetRepository,
    private petImageRepository: PetImageRepository,
  ) {}

  async execute(request: DeletePetImageRequest): Promise<void> {
    const pet = await this.petRepository.findById(request.petId);

    if (!pet) {
      throw new ResourceNotFoundError();
    }

    if (pet.orgId !== request.orgId) {
      throw new NotAllowedError();
    }

    const image = await this.petImageRepository.findById(request.imageId);

    if (!image || image.petId !== request.petId) {
      throw new ResourceNotFoundError();
    }

    await r2.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: image.key,
      }),
    );

    await this.petImageRepository.delete(request.imageId);
  }
}
