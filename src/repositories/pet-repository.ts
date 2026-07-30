import { Prisma, Pet } from "@prisma/client";

export interface PetRepository {
  //findManyByCity
  // findByAge(age: number): Promise<Pet[] | null>;
  findById(id: string): Promise<Pet | null>;
  updateAdoptionStatus(id: string, adopted: boolean): Promise<Pet | null>;
  create(data: Prisma.PetCreateInput): Promise<Pet>;
}
