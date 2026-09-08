import { OrgRepository } from "@/repositories/org-repository";
import { PetRepository } from "@/repositories/pet-repository";
import { PetImageRepository } from "@/repositories/pet-image-repository";
import { AnimalSize, AnimalType, Pet, PetImage } from "@prisma/client";

interface FetchPetByCityRequest {
  page: number;
  city: string;
  ageMin?: number;
  ageMax?: number;
  size?: AnimalSize;
  type?: AnimalType;
}

type PetWithWhatsapp = Pet & { whatsapp: string; images: PetImage[] };

export class FetchPetByCityUseCase {
  constructor(
    private petRepository: PetRepository,
    private orgRepository: OrgRepository,
    private petImageRepository: PetImageRepository,
  ) {}

  async execute(request: FetchPetByCityRequest): Promise<PetWithWhatsapp[]> {
    if (!request.city.trim()) {
      throw new Error("City is required");
    }

    const orgs = await this.orgRepository.findManyByCity(request.city);

    const pets = await this.petRepository.findManyByOrgIds(orgs, request.page, {
      ageMin: request.ageMin,
      ageMax: request.ageMax,
      size: request.size,
      type: request.type,
    });

    const whatsappByOrgId = new Map(orgs.map((org) => [org.id, org.whatsapp]));

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
      whatsapp: whatsappByOrgId.get(pet.orgId) ?? "",
      images: imagesByPetId.get(pet.id) ?? [],
    }));
  }
}