import { OrgRepository } from "@/repositories/org-repository";
import { PetRepository } from "@/repositories/pet-repository";
import { AnimalSize, AnimalType, Pet } from "@prisma/client";

interface FetchPetByCityRequest {
  page: number;
  city: string;
  age?: number;
  size?: AnimalSize;
  type?: AnimalType;
}

export class FetchPetByCityUseCase {
  constructor(
    private petRepository: PetRepository,
    private orgRepository: OrgRepository,
  ) {}

  async execute(request: FetchPetByCityRequest): Promise<Pet[]> {
    if (!request.city.trim()) {
      throw new Error("City is required");
    }

    const orgs = await this.orgRepository.findManyByCity(request.city);

    const pets = await this.petRepository.findManyByOrgIds(orgs, request.page, {
      age: request.age,
      size: request.size,
      type: request.type,
    });

    return pets;
  }
}