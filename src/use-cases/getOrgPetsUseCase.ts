import { PetRepository } from "@/repositories/pet-repository";
import { PetImageRepository } from "@/repositories/pet-image-repository";
import { Pet, PetImage } from "@prisma/client";

interface GetOrgPetsRequest {
  orgId: string;
  page: number;
}

type PetWithImages = Pet & { images: PetImage[] };

export class GetOrgPetsUseCase {
  constructor(
    private petRepository: PetRepository,
    private petImageRepository: PetImageRepository,
  ) {}

  async execute(request: GetOrgPetsRequest): Promise<PetWithImages[]> {
    const pets = await this.petRepository.findManyByOrgId(
      request.orgId,
      request.page,
    );

    const images = await this.petImageRepository.findManyByPetIds(
      pets.map((pet) => pet.id),
    );
    const imagesByPetId = new Map<string, PetImage[]>();
    for (const image of images) {
      const petImages = imagesByPetId.get(image.petId) ?? [];
      petImages.push(image);
      imagesByPetId.set(image.petId, petImages);
    }

    return pets.map((pet) => ({
      ...pet,
      images: imagesByPetId.get(pet.id) ?? [],
    }));
  }
}
