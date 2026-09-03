import { Prisma, Pet, AnimalSize, AnimalType, Org } from "@prisma/client";

export interface PetRepository {
  findManyByOrgIds(
    orgs: Org[], page: number, filters: { age?: number; size?: AnimalSize; type?: AnimalType },
  ): Promise<Pet[]>;
  findById(id: string): Promise<Pet | null>;
  updateAdoptionStatus(id: string, adopted: boolean): Promise<Pet | null>;
  create(data: Prisma.PetCreateInput): Promise<Pet>;
}
