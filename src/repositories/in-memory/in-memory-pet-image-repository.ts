import { randomUUID } from "node:crypto";
import { PetImage } from "@prisma/client";
import {
  CreatePetImageData,
  PetImageRepository,
} from "@/repositories/pet-image-repository";

export class InMemoryPetImageRepository implements PetImageRepository {
  public items: PetImage[] = [];

  async create(data: CreatePetImageData): Promise<PetImage> {
    const petImage: PetImage = {
      id: randomUUID(),
      petId: data.petId,
      key: data.key,
      url: data.url,
      created_at: new Date(),
    };

    this.items.push(petImage);

    return petImage;
  }

  async findById(id: string): Promise<PetImage | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findManyByPetId(petId: string): Promise<PetImage[]> {
    return this.items.filter((item) => item.petId === petId);
  }

  async findManyByPetIds(petIds: string[]): Promise<PetImage[]> {
    return this.items.filter((item) => petIds.includes(item.petId));
  }

  async countByPetId(petId: string): Promise<number> {
    return this.items.filter((item) => item.petId === petId).length;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id);
  }
}
