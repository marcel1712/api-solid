import { randomUUID } from "node:crypto";
import { PetRepository, UpdatePetData } from "@/repositories/pet-repository";
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

  async update(id: string, data: UpdatePetData): Promise<Pet | null> {
    const pet = await this.findById(id);
    if (!pet) {
      return null;
    }

    if (data.name !== undefined) pet.name = data.name;
    if (data.age !== undefined) pet.age = data.age;
    if (data.size !== undefined) pet.size = data.size;
    if (data.type !== undefined) pet.type = data.type;
    if (data.bio !== undefined) pet.bio = data.bio;

    return pet;
  }

  async findManyByOrgIds(
    orgs: Org[],
    page: number,
    filters: {
      ageMin?: number;
      ageMax?: number;
      size?: AnimalSize;
      type?: AnimalType;
    },
  ): Promise<Pet[]> {
    const orgIds = orgs.map((org) => org.id);

    const pets = this.items.filter((pet) => {
      if (!orgIds.includes(pet.orgId)) {
        return false;
      }
      if (pet.adopted) {
        return false;
      }
      if (filters.ageMin !== undefined && pet.age < filters.ageMin) {
        return false;
      }
      if (filters.ageMax !== undefined && pet.age > filters.ageMax) {
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

    const PAGE_SIZE = 20;
    return pets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }
}
