import { PetImage } from "@prisma/client";

export interface CreatePetImageData {
  petId: string;
  key: string;
  url: string;
}

export interface PetImageRepository {
  create(data: CreatePetImageData): Promise<PetImage>;
  findById(id: string): Promise<PetImage | null>;
  findManyByPetId(petId: string): Promise<PetImage[]>;
  findManyByPetIds(petIds: string[]): Promise<PetImage[]>;
  countByPetId(petId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
