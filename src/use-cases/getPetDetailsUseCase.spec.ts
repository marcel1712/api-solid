import { PetRepository } from "../repositories/pet-repository";
import { describe, it, beforeEach, expect } from "vitest";
import { GetPetDetailsUseCase } from "./getPetDetailsUseCase";
import { InMemoryPetRepository } from "../repositories/in-memory/in-memory-pet-repository";

let petRepository: PetRepository;
let sut: GetPetDetailsUseCase;

async function createPet() {
  return petRepository.create({
    name: "Nick",
    age: 9,
    size: "Small",
    type: "Dog",
    bio: "A very good boy",
    org: { connect: { id: "org-01" } },
  });
}

describe("Get Pet Details Use Case", () => {
  beforeEach(() => {
    petRepository = new InMemoryPetRepository();
    sut = new GetPetDetailsUseCase(petRepository);
  });

  it("should be able to get pet details", async () => {
    const pet = await createPet();

    const result = await sut.execute({ petId: pet.id });

    expect(result.id).toEqual(pet.id);
  });

  it("should return all pet data", async () => {
    const pet = await createPet();

    const result = await sut.execute({ petId: pet.id });

    expect(result).toEqual(
      expect.objectContaining({
        name: "Nick",
        age: 9,
        size: "Small",
        type: "Dog",
        bio: "A very good boy",
        orgId: "org-01",
      }),
    );
  });

  it("should not be able to get details of a non-existing pet", async () => {
    await expect(() =>
      sut.execute({ petId: "non-existing-pet-id" }),
    ).rejects.toThrow(new Error("This pet doesnt exist"));
  });
});
