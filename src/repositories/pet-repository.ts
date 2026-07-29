import { Prisma, Pet } from "@prisma/client";

export interface PetRepository {
  // findByAge(age: number): Promise<Pet[] | null>;
  // viewDetails(id: string): Promise<Pet | null>;
  // markAsAdopted(adopted: boolean): Promise<Pet | null>;
  create(data: Prisma.PetCreateInput): Promise<Pet>;
}
