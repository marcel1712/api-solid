import { Prisma, Pet, AnimalSize, AnimalType, Org } from "@prisma/client";

export interface UpdatePetData {
  name?: string;
  age?: number;
  size?: AnimalSize;
  type?: AnimalType;
  bio?: string;
}

export interface PetRepository {
  findManyByOrgIds(
    orgs: Org[],
    page: number,
    filters: {
      ageMin?: number;
      ageMax?: number;
      size?: AnimalSize;
      type?: AnimalType;
    },
  ): Promise<Pet[]>;
  findById(id: string): Promise<Pet | null>;
  findManyByOrgId(orgId: string, page: number): Promise<Pet[]>;
  updateAdoptionStatus(id: string, adopted: boolean): Promise<Pet | null>;
  update(id: string, data: UpdatePetData): Promise<Pet | null>;
  create(data: Prisma.PetCreateInput): Promise<Pet>;
}
