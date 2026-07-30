import { randomUUID } from "node:crypto";
import { PetRepository } from "../pet-repository";
import { Pet, Prisma } from "@prisma/client";

export class InMemoryPetRepository implements PetRepository {
  public items: Pet[] = [];

  async findById(id: string): Promise<Pet | null> {
    const pet = this.items.find((pet) => pet.id == id) || null;
    return pet;
  }
  // async findByAge(age: number): Promise<Pet[] | null> {
  //   console.log("hy");
  // }

  // async viewDetails(id: string): Promise<Pet | null> {
  //   console.log("opa");
  // }

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
}
