import { randomUUID } from "node:crypto";
import { PetRepository } from "@/repositories/pet-repository";
import { AnimalSize, AnimalType, Org, Pet, Prisma } from "@prisma/client";

export class InMemoryPetRepository implements PetRepository {
  public items: Pet[] = [];

  async create(data: Prisma.PetCreateInput) {
    const orgId = data.org.connect?.id;
    if (!orgId) {
      throw new Error("Org id is required to create a pet");
    }

    const pet = {
      id: randomUUID(),
      name: data.name,
      age: data.age,
      size: data.size,
      type: data.type,
      bio: data.bio ?? null,
      orgId,
      adopted: false,
      created_at: new Date(),
    };

    this.items.push(pet);

    return pet;
  }

  async findById(id: string): Promise<Pet | null> {
    const pet = this.items.find((pet) => pet.id == id) || null;
    return pet;
  }

  async updateAdoptionStatus(
    id: string,
    adopted: boolean,
  ): Promise<Pet | null> {
    const pet = await this.findById(id);
    if (!pet) {
      return null;
    }

    pet.adopted = adopted;

    return pet;
  }

  async findManyByOrgIds(
    orgs: Org[],
    filters: { age?: number; size?: AnimalSize; type?: AnimalType },
  ): Promise<Pet[]> {
    const orgIds = orgs.map((org) => org.id);

    const pets = this.items.filter((pet) => {
      if (!orgIds.includes(pet.orgId)) {
        return false;
      }
      if (filters.age !== undefined && pet.age !== filters.age) {
        return false;
      }
      if (filters.size !== undefined && pet.size !== filters.size) {
        return false;
      }
      if (filters.type !== undefined && pet.type !== filters.type) {
        return false;
      }
      return true;
    });

    return pets;
  }
}
