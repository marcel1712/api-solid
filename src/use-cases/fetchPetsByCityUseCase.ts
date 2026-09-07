import { OrgRepository } from "@/repositories/org-repository";
import { PetRepository } from "@/repositories/pet-repository";
import { AnimalSize, AnimalType, Pet } from "@prisma/client";

interface FetchPetByCityRequest {
  page: number;
  city: string;
  ageMin?: number;
  ageMax?: number;
  size?: AnimalSize;
  type?: AnimalType;
}

type PetWithWhatsapp = Pet & { whatsapp: string };

export class FetchPetByCityUseCase {
  constructor(
    private petRepository: PetRepository,
    private orgRepository: OrgRepository,
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

    return pets.map((pet) => ({
      ...pet,
      whatsapp: whatsappByOrgId.get(pet.orgId) ?? "",
    }));
  }
}