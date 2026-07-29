import { randomUUID } from "node:crypto";
import { PetRepository } from "../pet-repository";
import { Pet, Prisma } from "@prisma/client";

export class InMemoryPetRepository implements PetRepository {
  public items: Pet[] = [];

  // async findByAge(age: number): Promise<Pet[] | null> {
  //   console.log("hy");
  // }

  // async viewDetails(id: string): Promise<Pet | null> {
  //   console.log("opa");
  // }

  // async markAsAdopted(adopted: boolean): Promise<Pet | null> {
  //   console.log("fala");
  // }

  async create(data: Prisma.PetCreateInput) {
    const pet = {
      id: randomUUID(),
      name: data.name,
      age: data.age,
      size: data.size,
      type: data.type,
      bio: data.bio ?? null,
      orgId: data.org.connect!.id!,
      adopted: false,
      created_at: new Date(),
    };

    this.items.push(pet);

    return pet;
  }
}
